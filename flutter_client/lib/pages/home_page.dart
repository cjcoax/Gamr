import 'package:flutter/material.dart';
import '../widgets/game_card.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gamr')),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          GameCard(
            title: 'The Legend of Zelda',
            platform: 'Switch',
            genre: 'Adventure',
          ),
          SizedBox(height: 12),
          GameCard(
            title: 'Halo',
            platform: 'Xbox',
            genre: 'Shooter',
          ),
        ],
      ),
    );
  }
}
