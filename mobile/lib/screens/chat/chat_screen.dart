import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../auth/login_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessageModel> _messages = [];
  bool _sending = false;
  bool _loadingHistory = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final res = await ApiClient.get('/me/chat-history');
      setState(() {
        _messages.addAll((res as List).map((e) => ChatMessageModel.fromJson(e)));
        _loadingHistory = false;
      });
    } on SessionExpiredException {
      _goToLogin();
    } catch (_) {
      setState(() => _loadingHistory = false);
    }
  }

  void _goToLogin() {
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() {
      _messages.add(ChatMessageModel(sender: 'patient', message: text));
      _sending = true;
    });
    _controller.clear();
    _scrollToEnd();

    try {
      final res = await ApiClient.post('/ai/chat', body: {'message': text});
      setState(() {
        _messages.add(ChatMessageModel(
          sender: 'ai',
          message: res['reply'] ?? '',
          escalated: res['escalate'] ?? false,
        ));
      });
    } on SessionExpiredException {
      _goToLogin();
    } on ApiException catch (e) {
      setState(() {
        _messages.add(ChatMessageModel(sender: 'ai', message: 'خطأ: ${e.message}'));
      });
    } finally {
      setState(() => _sending = false);
      _scrollToEnd();
    }
  }

  void _scrollToEnd() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('المساعد الصحي')),
        body: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              color: AppColors.accentSoft,
              child: const Text(
                'هذا المساعد لا يُشخّص حالتك ولا يصف أدوية. في أي طارئ اتصل بالإسعاف فوراً (14/15).',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: AppColors.foreground),
              ),
            ),
            Expanded(
              child: _loadingHistory
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) => _MessageBubble(message: _messages[i]),
                    ),
            ),
            if (_sending)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text('المساعد يكتب...', style: TextStyle(fontSize: 12, color: Colors.black45)),
              ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        decoration: const InputDecoration(hintText: 'اكتب رسالتك...'),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      onPressed: _sending ? null : _send,
                      icon: const Icon(Icons.send),
                      style: IconButton.styleFrom(backgroundColor: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessageModel message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isPatient = message.sender == 'patient';
    return Align(
      alignment: isPatient ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: message.escalated
              ? AppColors.danger.withValues(alpha: 0.08)
              : isPatient
                  ? AppColors.primary
                  : AppColors.accentSoft,
          borderRadius: BorderRadius.circular(16),
          border: message.escalated ? Border.all(color: AppColors.danger) : null,
        ),
        child: Text(
          message.message,
          style: TextStyle(color: isPatient ? Colors.white : AppColors.foreground),
        ),
      ),
    );
  }
}
