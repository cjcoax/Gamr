import 'package:flutter/material.dart';
import 'secrets.dart';
import 'screens/home.dart';
import 'screens/library.dart';
import 'screens/search.dart';
import 'screens/profile.dart';

void main() {
  runApp(const GamrApp());
}

class GamrApp extends StatefulWidget {
  const GamrApp({super.key});

  @override
  State<GamrApp> createState() => _GamrAppState();
}

class _GamrAppState extends State<GamrApp> {
  int _selectedIndex = 0;
  static const List<Widget> _screens = <Widget>[
    HomeScreen(),
    SearchScreen(),
    LibraryScreen(),
    ProfileScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gamr',
      theme: ThemeData.dark(),
      home: Scaffold(
        body: Center(child: _screens[_selectedIndex]),
        bottomNavigationBar: BottomNavigationBar(
          items: const <BottomNavigationBarItem>[
            BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
            BottomNavigationBarItem(icon: Icon(Icons.library_books), label: 'Library'),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
          ],
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
        ),
      ),
    );
  }
}
