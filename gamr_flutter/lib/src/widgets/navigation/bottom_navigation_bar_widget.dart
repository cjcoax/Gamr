import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_flutter/lucide_flutter.dart';
// import 'package:gamr_flutter/src/core/theme/app_theme.dart'; // For direct color access if needed outside Theme.of(context)

class BottomNavigationItem {
  final String initialLocation;
  final IconData icon;
  final IconData activeIcon;
  final String label;

  BottomNavigationItem({
    required this.initialLocation,
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

// Define the items for the bottom navigation
final List<BottomNavigationItem> bottomNavItems = [
  BottomNavigationItem(
    initialLocation: '/', // Home
    icon: LucideIcons.home,
    activeIcon: LucideIcons.home, // Could use a filled version if available or different icon
    label: 'Home',
  ),
  BottomNavigationItem(
    initialLocation: '/library',
    icon: LucideIcons.library,
    activeIcon: LucideIcons.library,
    label: 'Library',
  ),
  // Placeholder for Add Game FAB, not directly in bottom nav based on original UI
  // The FAB is separate.
  BottomNavigationItem(
    initialLocation: '/discover',
    icon: LucideIcons.compass,
    activeIcon: LucideIcons.compass,
    label: 'Discover',
  ),
  BottomNavigationItem(
    initialLocation: '/profile',
    icon: LucideIcons.userCircle2,
    activeIcon: LucideIcons.userCircle2,
    label: 'Profile',
  ),
];

class BottomNavigationBarWidget extends StatelessWidget {
  final String currentLocation; // Current route location to determine active tab

  const BottomNavigationBarWidget({super.key, required this.currentLocation});

  int _calculateSelectedIndex(String location) {
    // Find the index of the item whose initialLocation matches the current route
    // This needs to be robust if routes are nested.
    // For now, direct match or startsWith.
    final index = bottomNavItems.indexWhere((item) => location == item.initialLocation || (item.initialLocation != '/' && location.startsWith(item.initialLocation)));
    return index != -1 ? index : 0; // Default to home if no match
  }

  void _onItemTapped(int index, BuildContext context) {
    GoRouter.of(context).go(bottomNavItems[index].initialLocation);
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _calculateSelectedIndex(currentLocation);
    final theme = Theme.of(context);

    return BottomNavigationBar(
      currentIndex: selectedIndex,
      onTap: (index) => _onItemTapped(index, context),
      type: BottomNavigationBarType.fixed, // Ensures all labels are visible and items don't shrink
      backgroundColor: theme.bottomNavigationBarTheme.backgroundColor ?? theme.colorScheme.surface,
      selectedItemColor: theme.bottomNavigationBarTheme.selectedItemColor ?? theme.colorScheme.primary,
      unselectedItemColor: theme.bottomNavigationBarTheme.unselectedItemColor ?? theme.colorScheme.onSurface.withOpacity(0.7),
      selectedFontSize: 12,
      unselectedFontSize: 12,
      // elevation: 0, // Usually set in theme
      items: bottomNavItems.map((item) {
        final bool isActive = bottomNavItems.indexOf(item) == selectedIndex;
        return BottomNavigationBarItem(
          icon: Icon(isActive ? item.activeIcon : item.icon),
          label: item.label,
        );
      }).toList(),
    );
  }
}
