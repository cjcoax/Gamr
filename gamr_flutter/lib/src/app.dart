import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gamr_flutter/src/core/theme/app_theme.dart';
import 'package:gamr_flutter/src/core/router/app_router.dart'; // Import the router

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider); // Watch the router provider

    return MaterialApp.router( // Use MaterialApp.router
      title: 'Gamr',
      theme: AppTheme.darkTheme, // Apply the dark theme
      routerConfig: router, // Set the routerConfig
      debugShowCheckedModeBanner: false,
    );
  }
}
