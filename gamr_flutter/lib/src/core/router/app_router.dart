import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gamr_flutter/src/features/auth/application/auth_provider.dart';
import 'package:gamr_flutter/src/widgets/navigation/main_scaffold_with_nav.dart';
import 'package:gamr_flutter/src/features/auth/presentation/screens/landing_screen.dart'; // Import actual LandingScreen
import 'package:gamr_flutter/src/features/home/presentation/screens/home_screen.dart'; // Import actual HomeScreen
// Placeholder screen imports - these will be created in later steps
// import 'package:gamr_flutter/src/features/game/presentation/screens/game_detail_screen.dart';
// import 'package:gamr_flutter/src/features/search/presentation/screens/search_screen.dart';
// import 'package:gamr_flutter/src/features/library/presentation/screens/library_screen.dart';
// import 'package:gamr_flutter/src/features/discover/presentation/screens/discover_screen.dart';
// import 'package:gamr_flutter/src/features/profile/presentation/screens/profile_screen.dart';
// import 'package:gamr_flutter/src/features/user/presentation/screens/user_profile_screen.dart';
// import 'package:gamr_flutter/src/core/presentation/screens/not_found_screen.dart';


// Simple placeholder widget for now
class PlaceholderScreen extends StatelessWidget {
  final String title;
  final Color color; // Added for visual distinction
  const PlaceholderScreen({super.key, required this.title, this.color = Colors.grey});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title), backgroundColor: color.withAlpha(100)),
      body: Container(
        color: color.withAlpha(50),
        child: Center(child: Text('Screen: $title')),
      ),
    );
  }
}

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
// Define navigator keys for each branch of the StatefulShellRoute if needed for deep linking or specific navigation tasks
// For now, we'll use one for the shell itself.
final _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/landing', // Start at landing, redirect will handle if auth
    debugLogDiagnostics: true,

    routes: [
      // Routes that are NOT part of the StatefulShell (no persistent bottom nav)
      GoRoute(
        path: '/landing',
        name: 'landing',
        builder: (context, state) => const LandingScreen(), // Use actual LandingScreen
      ),
      GoRoute(
        path: '/games/:id',
        name: 'gameDetail',
        parentNavigatorKey: _rootNavigatorKey, // Ensure this opens above the shell
        builder: (context, state) {
          final gameId = state.pathParameters['id']!;
          return PlaceholderScreen(title: 'Game Detail $gameId', color: Colors.teal); // Replace with GameDetailScreen
        },
      ),
       GoRoute(
        path: '/search', // Search can be a full screen page outside the shell or inside. Original seems to be full screen.
        name: 'search',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const PlaceholderScreen(title: 'Search', color: Colors.orange), // Replace with SearchScreen
      ),
      GoRoute(
        path: '/users/:id', // UserProfile is likely a full screen page too
        name: 'userProfile',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final userId = state.pathParameters['id']!;
          return PlaceholderScreen(title: 'User Profile $userId', color: Colors.purple); // Replace with UserProfileScreen
        },
      ),

      // StatefulShellRoute for screens with persistent bottom navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          // The UI for the shell (includes the scaffold and bottom nav bar)
          return MainScaffoldWithNav(navigationShell: navigationShell);
        },
        branches: [
          // Branch for Home
          StatefulShellBranch(
            // navigatorKey: _homeNavigatorKey, // Optional key for this branch
            routes: [
              GoRoute(
                path: '/',
                name: 'home',
                builder: (context, state) => const HomeScreen(), // Use actual HomeScreen
                // Nested routes within Home tab if any
                // routes: [
                //   GoRoute(path: 'details', builder: (context, state) => ...),
                // ],
              ),
            ],
          ),
          // Branch for Library
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/library',
                name: 'library',
                builder: (context, state) => const PlaceholderScreen(title: 'Library', color: Colors.blue), // Replace with LibraryScreen
              ),
            ],
          ),
          // Branch for Discover
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/discover',
                name: 'discover',
                builder: (context, state) => const PlaceholderScreen(title: 'Discover', color: Colors.red), // Replace with DiscoverScreen
              ),
            ],
          ),
          // Branch for Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                name: 'profile',
                builder: (context, state) => const PlaceholderScreen(title: 'Profile', color: Colors.indigo), // Replace with ProfileScreen
              ),
            ],
          ),
        ],
      ),
      // TODO: Add NotFound route later
    ],

    redirect: (BuildContext context, GoRouterState state) {
      final authStatus = authState.status;
      final isAuthenticated = authStatus == AuthStatus.authenticated;

      // While loading, don't redirect. A global loading indicator might be shown by App widget or initial route.
      if (authStatus == AuthStatus.loading || authStatus == AuthStatus.initial) {
        return null;
      }

      final isGoingToLanding = state.matchedLocation == '/landing';

      // Public routes that don't require auth (beyond landing)
      final isPublicRoute = state.matchedLocation.startsWith('/games/');
                                // Add other public paths if any, e.g. /about, /terms

      if (!isAuthenticated && !isGoingToLanding && !isPublicRoute) {
        return '/landing';
      }

      if (isAuthenticated && isGoingToLanding) {
        return '/'; // Default authenticated route
      }

      return null; // No redirect needed
    },
    // Consider using a refresh listenable if auth state changes can happen outside of navigation events
    // refreshListenable: GoRouterRefreshStream(ref.watch(authProvider.notifier).stream),
  );
});

// Helper class for refreshListenable (optional, can be complex to manage)
// class GoRouterRefreshStream extends ChangeNotifier {
//   late final StreamSubscription<dynamic> _subscription;
//   GoRouterRefreshStream(Stream<dynamic> stream) {
//     _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
//   }
//   @override
//   void dispose() {
//     _subscription.cancel();
//     super.dispose();
//   }
// }
