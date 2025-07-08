import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gamr_flutter/src/features/auth/application/auth_provider.dart';
import 'package:gamr_flutter/src/models/user_model.dart'; // For User type
import 'package:go_router/go_router.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final User? user = ref.watch(currentUserProvider);
    // final authStatus = ref.watch(authStatusProvider);

    // if (authStatus == AuthStatus.loading) {
    //   return const Scaffold(body: Center(child: CircularProgressIndicator()));
    // }
    // if (user == null) {
    //   // This should ideally be handled by router redirects
    //   return const Scaffold(body: Center(child: Text('Not authenticated.')));
    // }

    return Scaffold(
      appBar: AppBar(
        // backgroundColor is handled by the theme (AppTheme.darkTheme.appBarTheme)
        // elevation: 0, (handled by theme)
        automaticallyImplyLeading: false, // We are using a shell, no back button to a "parent"
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  'G',
                  style: TextStyle(
                    color: Colors.white, // Ensure contrast if primary color is light
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Gamr',
              style: Theme.of(context).appBarTheme.titleTextStyle,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.search),
            tooltip: 'Search',
            onPressed: () {
              context.go('/search');
            },
          ),
          IconButton(
            icon: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(LucideIcons.bell),
                Positioned(
                  top: 2, // Adjust for visual preference
                  right: 2, // Adjust for visual preference
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: Theme.of(context).extension<CustomThemeColors>()?.gamingGreen ?? Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
            tooltip: 'Notifications',
            onPressed: () {
              // TODO: Implement Notifications functionality or screen
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications tapped! (Not implemented)')),
              );
            },
          ),
          const SizedBox(width: 8), // Padding for the last icon
        ],
      ),
      body: ListView( // Using ListView to accommodate multiple sections
        children: <Widget>[
          // Placeholder for BannerAd
          _buildSectionPlaceholder(context, 'Banner Ad Section'),
          // Placeholder for UserStats
          _buildSectionPlaceholder(context, 'User Stats Section (User: ${user?.displayName ?? '...'})'),
          // Placeholder for CurrentlyPlaying
          _buildSectionPlaceholder(context, 'Currently Playing Section'),
          // Placeholder for DiscoverSection
          _buildSectionPlaceholder(context, 'Discover Section'),
          // Placeholder for RecentActivity
          _buildSectionPlaceholder(context, 'Recent Activity Section'),
          // Placeholder for LibraryPreview
          _buildSectionPlaceholder(context, 'Library Preview Section'),
          const SizedBox(height: 80), // Space for FAB and bottom nav bar
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Implement Add Game Dialog
          // For now, show a snackbar
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Add Game FAB tapped! (Not implemented)')),
          );
          // Example: context.go('/add-game-dialog-route'); or showDialog(...)
        },
        backgroundColor: Theme.of(context).colorScheme.primary,
        child: const Icon(LucideIcons.plus, color: Colors.white), // Ensure icon color contrasts with FAB bg
        tooltip: 'Add Game',
      ),
      // The bottom navigation bar is part of MainScaffoldWithNav
    );
  }

  Widget _buildSectionPlaceholder(BuildContext context, String title) {
    return Container(
      height: 150,
      margin: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.outline.withOpacity(0.5)),
      ),
      child: Center(
        child: Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
              ),
        ),
      ),
    );
  }
}
