/*
* Grabs list of available players from Music Assistant
*/

class AvailablePlayers {
  final String friendlyName;
  final String playerId;

  AvailablePlayers({required this.friendlyName, required this.playerId});

  factory AvailablePlayers.fromJson(Map<String, dynamic> json) {
    return AvailablePlayers(
      friendlyName: json['display_name'] as String? ?? 'Unknown Player',
      playerId: json['player_id'] as String? ?? '',
    );
  }
}
