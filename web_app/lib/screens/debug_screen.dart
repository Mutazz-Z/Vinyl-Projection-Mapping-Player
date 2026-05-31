import 'package:flutter/material.dart';
import 'package:web_app/factories/state.dart';
import 'package:web_app/main.dart';
import 'package:web_app/theme/app_theme.dart';

class DebugScreen extends StatefulWidget {
  const DebugScreen({super.key});

  @override
  State<DebugScreen> createState() => _DebugScreenState();
}

class _DebugScreenState extends State<DebugScreen> {
  final TextEditingController _uidController = TextEditingController(
    text: '83-E4-14-AD',
  );

  @override
  void dispose() {
    _uidController.dispose();
    super.dispose();
  }

  void _mockPlaceTag() {
    final String uid = _uidController.text.trim();
    if (uid.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a UID to mock placement.')),
      );
      return;
    }

    try {
      systemDataSource.write(globalLastKnownUidScanned, uid);

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Mocked placing tag: $uid')));
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Publish Failed: $e')));
    }
  }

  void _mockRemoveTag() {
    try {
      systemDataSource.write(globalCurrentShelfStatus, false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mocked record removal status sent.')),
      );
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Publish Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.pagePadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hardware Mock Controls',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: AppSpacing.inlineElementGap),
            Text(
              'Simulate physical interactions with the NFC reader shelf over the Web API.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextFormField(
                      controller: _uidController,
                      decoration: const InputDecoration(
                        labelText: 'Target Record UID',
                        hintText: 'Enter Hex Tag UID',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.nfc),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _mockPlaceTag,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade700,
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.sensors),
                            label: const Text('Mock Place Tag'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _mockRemoveTag,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red.shade700,
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.wrong_location),
                            label: const Text('Mock Remove Tag'),
                          ),
                        ),
                      ],
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
