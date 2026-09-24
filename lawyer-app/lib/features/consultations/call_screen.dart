import 'dart:async';

import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
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
  String? _error;

  Timer? _clock;
  Duration _elapsed = Duration.zero;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _clock?.cancel();
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
          _startClock();
        },
        onUserJoined: (connection, remoteUid, elapsed) {
          if (mounted) setState(() => _otherSideHere = true);
        },
        onUserOffline: (connection, remoteUid, reason) {
          if (mounted) setState(() => _otherSideHere = false);
        },
      ),
    );

    if (credentials.isVideo) {
      await engine.enableVideo();
      await engine.startPreview();
    } else {
      await engine.enableAudio();
    }

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
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsed += const Duration(seconds: 1));
    });
  }

  Future<void> _toggleMute() async {
    final next = !_muted;
    await _engine?.muteLocalAudioStream(next);
    if (mounted) setState(() => _muted = next);
  }

  Future<void> _toggleCamera() async {
    final next = !_cameraOff;
    await _engine?.muteLocalVideoStream(next);
    if (mounted) setState(() => _cameraOff = next);
  }

  Future<void> _hangUp() async {
    _clock?.cancel();
    await _engine?.leaveChannel();

    try {
      await _consultations.endConsultation(widget.consultationId);
    } on ApiException {
      // The other side or the server will close it.
    }

    if (mounted) Navigator.of(context).pop();
  }

  String get _duration {
    final minutes = _elapsed.inMinutes.toString().padLeft(2, '0');
    final seconds = (_elapsed.inSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
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

              Positioned(
                left: 0,
                right: 0,
                bottom: 28,
                child: _controls(video: credentials?.isVideo ?? false),
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
            child: AgoraVideoView(
              controller: VideoViewController(
                rtcEngine: engine,
                canvas: const VideoCanvas(uid: 0),
              ),
            ),
          ),
        ),
        Positioned(left: 20, top: 20, child: _header(onDark: true)),
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
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _joined
              ? (_otherSideHere ? _duration : 'Connecting…')
              : 'Joining ${widget.planName}…',
          style: const TextStyle(fontSize: 13, color: Colors.white70),
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
          onTap: _toggleMute,
        ),
        if (video) ...[
          const SizedBox(width: 18),
          _CallButton(
            icon: _cameraOff ? Icons.videocam_off : Icons.videocam,
            onTap: _toggleCamera,
          ),
        ],
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

class _CallButton extends StatelessWidget {
  const _CallButton({required this.icon, required this.onTap, this.colour});

  final IconData icon;
  final VoidCallback onTap;
  final Color? colour;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 58,
        height: 58,
        decoration: BoxDecoration(
          color: colour ?? Colors.white24,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 24, color: Colors.white),
      ),
    );
  }
}
