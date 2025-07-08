import 'package:flutter/material.dart';
import 'package:gamr_flutter/src/widgets/navigation/bottom_navigation_bar_widget.dart';
import 'package:go_router/go_router.dart';

class MainScaffoldWithNav extends StatelessWidget {
  final StatefulNavigationShell navigationShell; // Provided by StatefulShellRoute

  const MainScaffoldWithNav({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context) {
    // Get current location for the bottom nav bar
    // This is a bit tricky with StatefulShellRoute as the route state is managed internally.
    // We need to find the current location of the *active* branch of the shell.
    final String currentLocation = GoRouterState.of(context).matchedLocation;
    // A more robust way might involve listening to router changes or using the index from navigationShell.

    return Scaffold(
      body: navigationShell, // This displays the current page of the shell route
      bottomNavigationBar: BottomNavigationBarWidget(
        // Pass the current location or index to the bottom nav bar
        // For StatefulShellRoute, navigationShell.currentIndex is more reliable
        currentLocation: _getCurrentRoutePath(navigationShell.currentIndex)
      ),
       // Floating action button can be added here if it's common to all shell pages
       // floatingActionButton: FloatingActionButton(
       //   onPressed: () {
       //     // TODO: Implement Add Game Dialog
       //     // context.go('/add-game'); or show a dialog
       //   },
       //   child: Icon(Icons.add),
       //   backgroundColor: Theme.of(context).colorScheme.primary,
       // ),
       // floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked, // Or .endFloat etc.
    );
  }

  // Helper to map index to path for BottomNavigationBarWidget,
  // as it currently expects a path.
  // Ideally, BottomNavigationBarWidget would also accept an index.
  String _getCurrentRoutePath(int index) {
    if (index >= 0 && index < bottomNavItems.length) {
      return bottomNavItems[index].initialLocation;
    }
    return '/'; // Fallback to home
  }
}
