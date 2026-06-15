import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:web_app/utils/register_utils.dart';

Future<void> showColorPickerDialog({
  required BuildContext context,
  required String title,
  required TextEditingController controller,
  required VoidCallback onColorApplied,
}) async {
  Color tempColor = RegisterUtils.parseHexColor(controller.text.trim());

  await showDialog<void>(
    context: context,
    builder: (BuildContext dialogContext) {
      return AlertDialog(
        title: Text(title),
        content: SingleChildScrollView(
          child: ColorPicker(
            pickerColor: tempColor,
            onColorChanged: (Color newColor) => tempColor = newColor,
          ),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              controller.text = RegisterUtils.toHexColor(tempColor);
              onColorApplied();
              Navigator.pop(dialogContext);
            },
            child: const Text('Use Color'),
          ),
        ],
      );
    },
  );
}
