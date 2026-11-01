import 'dart:async';

import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../reports/report_screen.dart';
import 'chat_sheet.dart';
import 'consultation_repository.dart';

/// The consultation itself, over Agora.
///
/// Credentials come from our backend rather than the app: a token scoped to
/// this channel, this person, and roughly the length of the plan.
class CallScreen extends StatefulWidget {
  const CallScreen({
    super.key,
    required this.consultationId,
    required this.title,
    required this.planName,
  });

  final String consultationId;

  /// Who is on the other end.
  final String title;
  final String planName;

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  final _consultations = ConsultationRepository.instance;

  RtcEngine? _engine;
  CallCredentials? _credentials;

  bool _joined = false;
  bool _otherSideHere = false;
  bool _muted = false;
  bool _cameraOff = true;

  /// Follows the actual route, which the SDK reports — a headset or a
  /// Bluetooth earpiece takes over whatever we asked for.
  bool _speakerOn = false;
  String? _error;

  Timer? _clock;

  /// Tells the backend we are still here, every few seconds, and brings
  /// back whether the other side is.
  Timer? _heartbeat;
  CallAttendance? _attendance;

  /// How many messages had been seen when the chat was last closed, so the
  /// button can badge only what arrived since.
  int _messagesSeen = 0;

  /// What is left of the paid time. The deadline comes from the backend, so
  /// both sides count down to the same instant.
  Duration _left = Duration.zero;
  bool _timeUp = false;
  bool _paymentPaused = false;
  bool _videoUsageReported = false;
  bool _remoteVideoOn = false;
  DateTime? _preparingUntil;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _clock?.cancel();
    _heartbeat?.cancel();
    _engine?.leaveChannel();
    _engine?.release();
    super.dispose();
  }

  Future<void> _start() async {
    try {
      while (mounted) {
        final state = await ApiClient.instance.get(
          '/api/v1/lawyer/consultations/${widget.consultationId}/preparation',
        );
        if (!mounted) return;
        if (state['ended'] == true) {
          throw const ApiException(
            409,
            'CONSULTATION_ENDED',
            'This consultation has ended.',
          );
        }
        final readyAt = DateTime.tryParse(state['readyAt'] as String? ?? '')
            ?.toLocal();
        if (readyAt == null || !readyAt.isAfter(DateTime.now())) break;
        setState(() => _preparingUntil = readyAt);
        for (
          var second = 0;
          second < 5 && mounted && readyAt.isAfter(DateTime.now());
          second++
        ) {
          await Future<void>.delayed(const Duration(seconds: 1));
          if (mounted) setState(() {});
        }
      }
      if (!mounted) return;
      setState(() => _preparingUntil = null);
      final credentials = await _consultations.callCredentials(
        widget.consultationId,
      );
      if (!mounted) return;
      _credentials = credentials;

      // A call cannot start without these, so ask before joining.
      final granted = await _askForDevices(video: credentials.isVideo);
      if (!granted) {
        setState(
          () => _error =
              'Microphone${credentials.isVideo ? ' and camera' : ''} access is '
              'needed for this consultation.',
        );
        return;
      }

      _startClock();
      _startHeartbeat();
      await _join(credentials);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  Future<void> _renewCallToken() async {
    try {
      final credentials = await _consultations.callCredentials(
        widget.consultationId,
      );
      if (!mounted) return;
      await _engine?.renewToken(credentials.token);
      setState(() => _credentials = credentials);
    } on ApiException {
      /* The next backend heartbeat keeps the session state accurate. */
    }
  }

  Future<bool> _askForDevices({required bool video}) async {
    // Audio remains available even when the customer declines camera access.
    return (await Permission.microphone.request()).isGranted;
  }

  Future<void> _join(CallCredentials credentials) async {
    final engine = createAgoraRtcEngine();
    _engine = engine;

    await engine.initialize(RtcEngineContext(appId: credentials.appId));

    engine.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (connection, elapsed) {
          if (!mounted) return;
          setState(() => _joined = true);
          _beat();
        },
        onTokenPrivilegeWillExpire: (connection, token) {
          _renewCallToken();
        },
        onUserJoined: (connection, remoteUid, elapsed) {
          if (mounted && remoteUid == 1) setState(() => _otherSideHere = true);
        },
        onUserMuteVideo: (connection, remoteUid, muted) {
          if (mounted &&
              remoteUid != 1001 &&
              remoteUid != 1002 &&
              remoteUid != 1003) {
            setState(() => _remoteVideoOn = !muted);
          }
        },
        onUserOffline: (connection, remoteUid, reason) {
          if (mounted && remoteUid == 1) setState(() => _otherSideHere = false);
        },
        // Plugging in a headset or connecting Bluetooth changes the route
        // behind our back, so the button follows the device rather than
        // claiming whatever we last asked for.
        onAudioRoutingChanged: (routing) {
          if (!mounted) return;
          setState(
            () => _speakerOn =
                routing == AudioRoute.routeSpeakerphone.value() ||
                routing == AudioRoute.routeLoudspeaker.value(),
          );
        },
      ),
    );

    if (credentials.isVideo) {
      await engine.enableVideo();
      await engine.enableLocalVideo(false);
      await engine.muteLocalVideoStream(true);
    } else {
      await engine.enableAudio();
    }

    // A video call is held at arm's length, so it belongs on the speaker; a
    // voice call is held to the ear. Without this the SDK picks for us, and
    // it picks the speaker once video has ever been enabled.
    _speakerOn = false;
    await engine.setDefaultAudioRouteToSpeakerphone(_speakerOn);

    await engine.joinChannel(
      token: credentials.token,
      channelId: credentials.channel,
      uid: credentials.uid,
      options: const ChannelMediaOptions(
        clientRoleType: ClientRoleType.clientRoleBroadcaster,
        channelProfile: ChannelProfileType.channelProfileCommunication,
      ),
    );
  }

  void _startClock() {
    _clock?.cancel();
    _tick();
    _clock = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  /// True while the request is being sent.
  bool _askingForTime = false;

  /// Asks the client for more minutes. They decide; nothing moves until
  /// they do.
  Future<void> _askForMoreTime() async {
    setState(() => _askingForTime = true);

    try {
      await _consultations.requestExtension(widget.consultationId);
    } on ApiException catch (error) {
      _say(error.message);
    } finally {
      if (mounted) setState(() => _askingForTime = false);
      // Picks up the pending question, and the new deadline once agreed.
      await _beat();
      await _refreshDeadline();
    }
  }

  /// Re-reads the deadline, which moves the moment the client agrees.
  Future<void> _refreshDeadline() async {
    try {
      final credentials = await _consultations.callCredentials(
        widget.consultationId,
      );
      if (mounted) {
        setState(() => _credentials = credentials);
        _tick();
      }
    } on ApiException {
      // The next heartbeat carries on regardless.
    }
  }

  /// The customer has gone quiet. The lawyer cannot do anything about it
  /// but should not be left talking to nobody without knowing.
  bool get _customerGone =>
      _attendance != null && !_attendance!.customerPresent;

  void _startHeartbeat() {
    _heartbeat?.cancel();
    _beat();
    _heartbeat = Timer.periodic(const Duration(seconds: 8), (_) => _beat());
  }

  Future<void> _beat() async {
    if (!_joined) return;
    try {
      final attendance = await _consultations.ping(widget.consultationId);
      if (!_cameraOff &&
          !_videoUsageReported &&
          attendance.customerPresent &&
          attendance.lawyerPresent) {
        final usage = await ApiClient.instance.post(
          '/api/v1/lawyer/consultations/${widget.consultationId}/media/video',
          auth: true,
        );
        _videoUsageReported = usage['recorded'] == true;
      }
      if (attendance.ended && mounted && !_timeUp) {
        _timeUp = true;
        if (attendance.expiresAt == null) {
          Navigator.of(context).pop();
          return;
        }
        _hangUp();
        return;
      }
      if (!mounted) return;

      final before = _attendance;
      setState(() => _attendance = attendance);

      // The client has answered a question that was outstanding. Say which
      // way it went: mid-conversation, a countdown that quietly jumps is
      // easy to miss.
      if (before?.pendingExtension != null &&
          attendance.pendingExtension == null) {
        final agreed = attendance.extensionsAgreed > before!.extensionsAgreed;
        if (agreed) await _refreshDeadline();
        _say(
          agreed
              ? 'Your client added ${before.pendingExtension!.minutes} minutes '
                    'to the call.'
              : 'Your client did not add more time.',
        );
      }
    } on ApiException {
      // A dropped beat is not worth showing; the next one will do.
    }
  }

  void _say(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 4)),
    );
  }

  void _tick() {
    final endsAt = _attendance?.expiresAt ?? _credentials?.expiresAt;
    if (endsAt == null || !mounted) return;

    final left = endsAt.difference(DateTime.now());
    setState(() => _left = left.isNegative ? Duration.zero : left);

    // The backend closes the consultation at the same moment; leaving here
    // keeps the screen honest rather than sitting on a dead channel.
    final expired = left.isNegative || left.inSeconds == 0;
    if (expired && !_paymentPaused) {
      _paymentPaused = true;
      _engine?.muteLocalAudioStream(true);
      _engine?.muteAllRemoteAudioStreams(true);
      _engine?.muteLocalVideoStream(true);
      _engine?.muteAllRemoteVideoStreams(true);
    } else if (!expired && _paymentPaused) {
      _paymentPaused = false;
      _engine?.muteLocalAudioStream(_muted);
      _engine?.muteAllRemoteAudioStreams(false);
      _engine?.muteLocalVideoStream(_cameraOff);
      _engine?.muteAllRemoteVideoStreams(false);
    }
    if ((left.isNegative || left.inSeconds == 0) &&
        _attendance?.pendingExtension != null) {
      return;
    }
    if (left.isNegative || left.inSeconds == 0) {
      _clock?.cancel();
      if (!_timeUp) {
        _timeUp = true;
        _hangUp();
      }
    }
  }

  Future<void> _toggleMute() async {
    if (_paymentPaused) return;
    final next = !_muted;
    await _engine?.muteLocalAudioStream(next);
    if (mounted) setState(() => _muted = next);
  }

  Future<void> _toggleSpeaker() async {
    final next = !_speakerOn;
    await _engine?.setEnableSpeakerphone(next);
    if (mounted) setState(() => _speakerOn = next);
  }

  Future<void> _toggleCamera() async {
    if (_paymentPaused) return;
    final next = !_cameraOff;
    if (!next && !(await Permission.camera.request()).isGranted) return;

    // Both are needed: muting stops the stream reaching the other side,
    // while disabling actually turns the camera off. Muting alone leaves
    // our own preview running, so the button looks like it did nothing.
    await _engine?.enableLocalVideo(!next);
    await _engine?.muteLocalVideoStream(next);

    if (mounted) setState(() => _cameraOff = next);
  }

  /// Lines that have arrived since the chat was last closed.
  int get _unread {
    final total = _attendance?.messageCount ?? 0;
    final unseen = total - _messagesSeen;
    return unseen < 0 ? 0 : unseen;
  }

  Future<void> _openChat() async {
    final seen = await ChatSheet.open(
      context,
      consultationId: widget.consultationId,
      mine: 'lawyer',
      otherName: widget.title,
    );
    if (!mounted) return;

    // Everything in the thread has now been read.
    setState(() => _messagesSeen = seen ?? _attendance?.messageCount ?? 0);
    await _beat();
  }

  Future<void> _hangUp() async {
    _clock?.cancel();
    await _engine?.leaveChannel();

    try {
      await _consultations.endConsultation(widget.consultationId);
    } on ApiException {
      // The other side or the server will close it.
    }

    if (!mounted) return;

    // Straight into the report: this is the moment the lawyer remembers the
    // conversation, and the clock on it has already started.
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => ReportScreen(consultationId: widget.consultationId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final preparing = _preparingUntil;
    if (preparing != null) {
      final seconds = preparing
          .difference(DateTime.now())
          .inSeconds
          .clamp(0, 86400);
      return Scaffold(
        appBar: AppBar(title: const Text('Get ready')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.timer_outlined, size: 48),
                const SizedBox(height: 20),
                const Text(
                  'Your consultation starts in',
                  style: TextStyle(fontSize: 18),
                ),
                Text(
                  '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}',
                  style: const TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Keep your microphone and documents ready. Paid time begins once both participants join.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }
    final credentials = _credentials;

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.ink,
        body: SafeArea(
          child: Stack(
            children: [
              if (credentials != null && credentials.isVideo && _joined)
                _video(credentials)
              else
                _voice(),

              if (_joined &&
                  (_attendance?.expiresAt ?? _credentials?.expiresAt) == null)
                const Positioned(
                  top: 16,
                  left: 16,
                  right: 16,
                  child: Center(
                    child: Text(
                      'Waiting for both participants · Timer has not started',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              // Above everything else, so the time left is never buried by
              // the video or the other person's tile.
              if ((_attendance?.expiresAt ?? _credentials?.expiresAt) != null)
                Positioned(
                  left: 0,
                  right: 0,
                  top: 16,
                  child: Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _CountdownPill(left: _left),
                        // Asking is only offered while the call is running
                        // and there is no question already outstanding.
                        if (_attendance?.canAskForMore ?? false) ...[
                          const SizedBox(width: 8),
                          _ExtendButton(
                            waiting: _askingForTime,
                            // Nudged once the end is close, so the client is
                            // asked before the conversation is cut off.
                            urgent: _left.inSeconds <= 120,
                            onTap: _askForMoreTime,
                          ),
                        ],
                        if (_attendance?.pendingExtension != null) ...[
                          const SizedBox(width: 8),
                          const _WaitingPill(),
                        ],
                      ],
                    ),
                  ),
                ),

              // Over the video, with a scrim: white buttons on a bright
              // room wash out otherwise.
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.only(top: 40, bottom: 28),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black54],
                    ),
                  ),
                  child: _controls(video: credentials?.isVideo ?? false),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// The other person full-screen, with our own camera in the corner.
  Widget _video(CallCredentials credentials) {
    final engine = _engine;
    if (engine == null) return _voice();

    return Stack(
      children: [
        Positioned.fill(
          child: _otherSideHere && _remoteVideoOn
              ? AgoraVideoView(
                  controller: VideoViewController.remote(
                    rtcEngine: engine,
                    // The other side's uid is whichever one is not ours.
                    canvas: VideoCanvas(uid: credentials.uid == 1 ? 2 : 1),
                    connection: RtcConnection(channelId: credentials.channel),
                    // On iOS the default is a native UIView, which paints
                    // over every Flutter widget — the countdown and the call
                    // buttons end up underneath the picture. Rendering into
                    // a Flutter texture puts them back on top. Ignored on
                    // Android, which already composites correctly.
                    useFlutterTexture: true,
                  ),
                )
              : (_otherSideHere ? _voice() : _waitingForOther()),
        ),
        Positioned(
          top: 16,
          right: 16,
          width: 110,
          height: 150,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            // A disabled camera leaves the last frame on screen, which reads
            // as a frozen picture rather than a camera that is off.
            child: _cameraOff
                ? Container(
                    color: Colors.black54,
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.videocam_off,
                      size: 26,
                      color: Colors.white70,
                    ),
                  )
                : AgoraVideoView(
                    controller: VideoViewController(
                      rtcEngine: engine,
                      canvas: const VideoCanvas(uid: 0),
                      useFlutterTexture: true,
                    ),
                  ),
          ),
        ),
        Positioned(left: 20, right: 20, top: 20, child: _header(onDark: true)),
      ],
    );
  }

  Widget _voice() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 46,
            backgroundColor: Colors.white24,
            child: Text(
              widget.title.isNotEmpty ? widget.title[0].toUpperCase() : '?',
              style: const TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 18),
          _header(onDark: false),
          if (_error != null) ...[
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.white70),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _waitingForOther() {
    return Container(
      color: AppColors.ink,
      child: const Center(
        child: Text(
          'Waiting for the other side to join…',
          style: TextStyle(fontSize: 14, color: Colors.white70),
        ),
      ),
    );
  }

  Widget _header({required bool onDark}) {
    return Column(
      crossAxisAlignment: onDark
          ? CrossAxisAlignment.start
          : CrossAxisAlignment.center,
      children: [
        Text(
          widget.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
            // Keeps the name legible against a bright video behind it.
            shadows: [Shadow(blurRadius: 8, color: Colors.black54)],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _joined
              ? (_customerGone
                    ? 'Customer disconnected — waiting'
                    : (_otherSideHere ? widget.planName : 'Connecting…'))
              : 'Joining ${widget.planName}…',
          style: const TextStyle(
            fontSize: 13,
            color: Colors.white70,
            shadows: [Shadow(blurRadius: 8, color: Colors.black54)],
          ),
        ),
      ],
    );
  }

  Widget _controls({required bool video}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _CallButton(
          icon: _muted ? Icons.mic_off : Icons.mic,
          active: _muted,
          onTap: _toggleMute,
        ),
        const SizedBox(width: 18),
        _CallButton(
          icon: _speakerOn ? Icons.volume_up : Icons.volume_down,
          // Lit when on, so the current route is readable at a glance.
          active: _speakerOn,
          onTap: _toggleSpeaker,
        ),
        if (video) ...[
          const SizedBox(width: 18),
          _CallButton(
            icon: _cameraOff ? Icons.videocam_off : Icons.videocam,
            active: _cameraOff,
            onTap: _toggleCamera,
          ),
        ],
        const SizedBox(width: 18),
        _CallButton(
          icon: Icons.chat_bubble_outline,
          // People type what is hard to say: a case number, a spelling.
          badge: _unread,
          onTap: _openChat,
        ),
        const SizedBox(width: 18),
        _CallButton(
          icon: Icons.call_end,
          colour: AppColors.negative,
          onTap: _hangUp,
        ),
      ],
    );
  }
}

/// Asks the client for more minutes, beside the countdown.
class _ExtendButton extends StatelessWidget {
  const _ExtendButton({
    required this.waiting,
    required this.urgent,
    required this.onTap,
  });

  final bool waiting;

  /// Highlighted as the end approaches, so the client is asked in time.
  final bool urgent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MediaQuery.withNoTextScaling(
      child: GestureDetector(
        onTap: waiting ? null : onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: urgent ? Colors.white : Colors.black54,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.more_time,
                size: 15,
                color: urgent ? AppColors.ink : Colors.white,
              ),
              const SizedBox(width: 5),
              Text(
                'Add time',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: urgent ? AppColors.ink : Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The client has been asked and has not answered yet.
class _WaitingPill extends StatelessWidget {
  const _WaitingPill();

  @override
  Widget build(BuildContext context) {
    return MediaQuery.withNoTextScaling(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: Colors.black54,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'Asked — waiting',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.white70,
          ),
        ),
      ),
    );
  }
}

/// How much of the paid consultation is left, counted down from a deadline
/// the backend set — so both phones show the same figure.
class _CountdownPill extends StatelessWidget {
  const _CountdownPill({required this.left});

  final Duration left;

  /// The last minute goes red, as a warning that the call is about to end.
  bool get _urgent => left.inSeconds <= 60;

  @override
  Widget build(BuildContext context) {
    final minutes = left.inMinutes.toString().padLeft(2, '0');
    final seconds = (left.inSeconds % 60).toString().padLeft(2, '0');

    return MediaQuery.withNoTextScaling(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: _urgent ? AppColors.negative : Colors.black54,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.timer_outlined, size: 15, color: Colors.white),
            const SizedBox(width: 6),
            Text(
              '$minutes:$seconds left',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallButton extends StatelessWidget {
  const _CallButton({
    required this.icon,
    required this.onTap,
    this.colour,
    this.active = false,
    this.badge = 0,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color? colour;

  /// Filled white with a dark icon, for a toggle that is currently on.
  final bool active;

  /// Unread count, shown as a dot on the corner. Zero shows nothing.
  final int badge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 58,
            height: 58,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: colour ?? (active ? Colors.white : Colors.white24),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 24,
              color: active && colour == null ? AppColors.ink : Colors.white,
            ),
          ),
          if (badge > 0)
            Positioned(
              right: -2,
              top: -2,
              child: MediaQuery.withNoTextScaling(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  constraints: const BoxConstraints(minWidth: 20),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.negative,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    badge > 9 ? '9+' : '$badge',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
