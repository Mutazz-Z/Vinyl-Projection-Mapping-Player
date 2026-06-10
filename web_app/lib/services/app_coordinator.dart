import 'package:flutter/material.dart';
import 'package:web_app/factories/state.dart';
import '../screens/register_screen.dart';
import 'system_data_source.dart';

class AppCoordinator {
  final SystemDataSource dataSource;
  final GlobalKey<NavigatorState> navigatorKey;

  AppCoordinator({required this.dataSource, required this.navigatorKey});

  void start() {
    dataSource.onDataSourceChanged.listen((args) {
      if (args.variable == globalLastUnknownUidScanned.keyName) {
        UidScanned_t lastUnknownTagScanned = UidScanned_t.fromJson(args.data);
        _handleRegistrationRequest(lastUnknownTagScanned.uid);
      }
    });

    debugPrint('AppCoordinator: Active DataSource stream configured.');
  }

  void _handleRegistrationRequest(String uid) {
    if (uid.isEmpty) return;
    debugPrint('AppCoordinator: Registration trigger received for UID "$uid".');
    navigatorKey.currentState?.push(
      MaterialPageRoute(builder: (_) => RegisterScreen(uid: uid)),
    );
  }
}
