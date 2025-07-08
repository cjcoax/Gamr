import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gamr_flutter/src/features/auth/application/auth_provider.dart';
import 'package:gamr_flutter/src/core/theme/app_theme.dart'; // For colors
import 'package:url_launcher/url_launcher.dart'; // To open web URLs

class LandingScreen extends ConsumerWidget {
  const LandingScreen({super.key});

  Future<void> _launchURL(BuildContext context, WidgetRef ref, String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url, mode: LaunchMode.inAppWebView)) { // Or LaunchMode.externalApplication
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not launch $urlString')),
        );
      }
    } else {
      // After attempting to launch, you might want to periodically check auth status
      // or wait for a deep link if your app supports it.
      // For now, we'll assume the user logs in and might need to restart or manually refresh.
      // A more sophisticated flow would involve deep linking back to the app.
      ref.read(authProvider.notifier).checkAuthStatus(); // Re-check auth after a delay or app focus
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authNotifier = ref.read(authProvider.notifier);
    final authState = ref.watch(authProvider);

    // Listen to auth status changes to potentially navigate away if login is successful elsewhere
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.status == AuthStatus.authenticated) {
        // Router's redirect logic should handle this, but good to be aware.
        // No explicit navigation here to avoid conflicts with GoRouter redirects.
      }
    });

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              // Placeholder for App Logo/Title
              Text(
                'Gamr',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: gamingPurpleColor, // From app_theme.dart
                    ),
              ),
              const SizedBox(height: 16),
              Text(
                'Track. Discover. Conquer.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onBackground.withOpacity(0.8),
                    ),
              ),
              const SizedBox(height: 48),
              if (authState.status == AuthStatus.loading)
                const Center(child: CircularProgressIndicator())
              else
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16.0),
                    textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () {
                    // The original /api/login is a GET request that redirects.
                    // We'll use url_launcher to open this in a webview/browser.
                    final loginUrl = authNotifier.getWebLoginUrl();
                    _launchURL(context, ref, loginUrl);
                  },
                  child: const Text('Login with Replit'), // Or just 'Login'
                ),
              const SizedBox(height: 16),
              // Placeholder for "Continue as Guest" or other options if any
              // TextButton(
              //   onPressed: () {
              //     // Navigate to a guest experience or public part of the app
              //     // e.g. context.go('/home_guest');
              //   },
              //   child: Text(
              //     'Continue as Guest',
              //     style: TextStyle(color: Theme.of(context).colorScheme.onBackground.withOpacity(0.7)),
              //   ),
              // ),
              if (authState.status == AuthStatus.error && authState.errorMessage != null) ...[
                const SizedBox(height: 24),
                Text(
                  'Error: ${authState.errorMessage}',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }
}
