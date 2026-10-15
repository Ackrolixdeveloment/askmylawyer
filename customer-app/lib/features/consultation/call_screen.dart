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
  bool _cameraOff = false;

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

  /// True while the "end and refund" request is in flight.
  bool _leaving = false;

  /// True while yes or no is being sent.
  bool _answering = false;

  /// What is left of the paid time. The deadline comes from the backend, so
  /// both sides count down to the same instant.
  Duration _left = Duration.zero;
  bool _timeUp = false;

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

  Future<bool> _askForDevices({required bool video}) async {
    final wanted = <Permission>[
      Permission.microphone,
      if (video) Permission.camera,
    ];

    final results = await wanted.request();
    return results.values.every((status) => status.isGranted);
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
        },
        onUserJoined: (connection, remoteUid, elapsed) {
          if (mounted) setState(() => _otherSideHere = true);
        },
        onUserOffline: (connection, remoteUid, reason) {
          if (mounted) setState(() => _otherSideHere = false);
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
      await engine.startPreview();
    } else {
      await engine.enableAudio();
    }

    // A video call is held at arm's length, so it belongs on the speaker; a
    // voice call is held to the ear. Without this the SDK picks for us, and
    // it picks the speaker once video has ever been enabled.
    _speakerOn = credentials.isVideo;
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

  void _startHeartbeat() {
    _heartbeat?.cancel();
    _beat();
    _heartbeat = Timer.periodic(const Duration(seconds: 8), (_) => _beat());
  }

  Future<void> _beat() async {
    try {
      final attendance = await _consultations.ping(widget.consultationId);
      if (mounted) setState(() => _attendance = attendance);
    } on ApiException {
      // A dropped beat is not worth showing; the next one will do.
    }
  }

  void _tick() {
    final endsAt = _credentials?.expiresAt;
    if (endsAt == null || !mounted) return;

    final left = endsAt.difference(DateTime.now());
    setState(() => _left = left.isNegative ? Duration.zero : left);

    // The backend closes the consultation at the same moment; leaving here
    // keeps the screen honest rather than sitting on a dead channel.
    if (left.isNegative || left.inSeconds == 0) {
      _clock?.cancel();
      if (!_timeUp) {
        _timeUp = true;
        _hangUp();
      }
    }
  }

  Future<void> _toggleMute() async {
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
    final next = !_cameraOff;

    // Both are needed: muting stops the stream reaching the other side,
    // while disabling actually turns the camera off. Muting alone leaves
    // our own preview running, so the button looks like it did nothing.
    await _engine?.enableLocalVideo(!next);
    await _engine?.muteLocalVideoStream(next);

    if (mounted) setState(() => _cameraOff = next);
  }

  /// Yes or no to the lawyer's request for more minutes.
  Future<void> _answerExtension(bool accept) async {
    final pending = _attendance?.pendingExtension;
    if (pending == null) return;

    setState(() => _answering = true);

    try {
      await _consultations.answerExtension(
        widget.consultationId,
        pending.id,
        accept: accept,
      );
      // The deadline has moved; take the new one rather than waiting for
      // the next heartbeat, so the countdown jumps straight away.
      if (accept) await _refreshDeadline();
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _answering = false);
      await _beat();
    }
  }

  /// Re-reads the call's deadline after it has been extended.
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

  /// The lawyer is not coming back: close it and take the unused time back.
  Future<void> _endAbandoned() async {
    setState(() => _leaving = true);

    final ({int refundAmount, String reason}) result;
    try {
      result = await _consultations.endAbandoned(widget.consultationId);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _leaving = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
      return;
    }

    _clock?.cancel();
    _heartbeat?.cancel();
    await _engine?.leaveChannel();
    if (!mounted) return;

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.refundAmount > 0
              ? '${result.reason} ₹${result.refundAmount} is on its way back.'
              : result.reason,
        ),
      ),
    );
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
      mine: 'customer',
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

    // Into the report, which is being written while they read this.
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => ReportScreen(consultationId: widget.consultationId),
      ),
    );
  }



  @override
  Widget build(BuildContext context) {
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

              // Above everything else, so the time left is never buried by
              // the video or the other person's tile.
              if (_credentials?.expiresAt != null)
                Positioned(
                  left: 0,
                  right: 0,
                  top: 16,
                  child: Center(child: _CountdownPill(left: _left)),
                ),

              // The lawyer has asked for more time. Sits over the call
              // rather than blocking it — they are still talking while
              // they read it.
              if (_attendance?.pendingExtension != null)
                Positioned(
                  left: 16,
                  right: 16,
                  top: 64,
                  child: _ExtensionPrompt(
                    extension: _attendance!.pendingExtension!,
                    busy: _answering,
                    onAnswer: _answerExtension,
                  ),
                ),

              // The lawyer has gone quiet. Say so plainly rather than
              // leaving the customer watching a frozen screen, and offer
              // the way out.
              if (_attendance?.canEndAndRefund ?? false)
                Positioned(
                  left: 16,
                  right: 16,
                  // Below the extension prompt, on the rare occasion both
                  // are up at once.
                  top: _attendance?.pendingExtension != null ? 210 : 64,
                  child: _AbandonedNotice(
                    refund: _attendance!.refundIfEndedNow,
                    busy: _leaving,
                    onEnd: _endAbandoned,
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
          child: _otherSideHere
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
              : _waitingForOther(),
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
        Positioned(
          left: 20,
          right: 20,
          top: 20,
          child: _header(onDark: true),
        ),
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
              ? (_otherSideHere ? widget.planName : 'Connecting…')
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

/// The lawyer wants more minutes; the customer decides.
///
/// Deliberately not a dialog: they are mid-conversation, and a modal would
/// cut the call dead behind it. No answer means no — it lapses on its own.
class _ExtensionPrompt extends StatelessWidget {
  const _ExtensionPrompt({
    required this.extension,
    required this.busy,
    required this.onAnswer,
  });

  final PendingExtension extension;
  final bool busy;
  final void Function(bool accept) onAnswer;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your lawyer needs ${extension.minutes} more minutes',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '₹${extension.amount}, added to your bill and paid when you '
            'download your consultation report.',
            style: const TextStyle(
              fontSize: 12,
              height: 1.4,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: busy ? null : () => onAnswer(false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white38),
                    padding: const EdgeInsets.symmetric(vertical: 11),
                  ),
                  child: const Text('No thanks'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  onPressed: busy ? null : () => onAnswer(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.ink,
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    textStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  child: Text(busy ? 'Just a moment…' : 'Add the time'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Shown to the customer when the lawyer has dropped out of the call.
///
/// Covers every reason at once — went offline, closed the app, lost signal —
/// because from this side they are all the same thing.
class _AbandonedNotice extends StatelessWidget {
  const _AbandonedNotice({
    required this.refund,
    required this.busy,
    required this.onEnd,
  });

  /// Rupees back if they end it now. Zero when nothing was paid.
  final int refund;
  final bool busy;
  final VoidCallback onEnd;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your lawyer has disconnected',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            refund > 0
                ? 'Waiting for them to come back. You can end this and get '
                      '₹$refund back for the time you did not get.'
                : 'Waiting for them to come back. You can end this now if '
                      'you would rather not wait.',
            style: const TextStyle(
              fontSize: 12,
              height: 1.4,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: busy ? null : onEnd,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.ink,
                padding: const EdgeInsets.symmetric(vertical: 11),
                textStyle: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: Text(
                busy
                    ? 'Ending…'
                    : (refund > 0 ? 'End & get ₹$refund back' : 'End consultation'),
              ),
            ),
          ),
        ],
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
