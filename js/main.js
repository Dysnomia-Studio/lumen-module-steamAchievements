// CONFIG
const API_KEY = ''; // Get one here: https://steamcommunity.com/dev/apikey
const STEAM_ID = '';

class SteamAchievements {
	static async init() {
		if(!AppDataManager.exists('steamAchievements', 'steamData')) {
			await SteamAchievements.fetchData();
		} else {
			SteamAchievements.data = AppDataManager.loadObject('steamAchievements', 'steamData');
		}

		SteamAchievements.computeAchievements();
		SteamAchievements.drawModule();
	}

	static async drawModule() {
		document.getElementById('module-steamAchievements-gameCount').innerText = SteamAchievements.data.game_count;
		document.getElementById('module-steamAchievements-achievementsCount').innerText =SteamAchievements.playedGamesAchievementCount;
	}

	static async computeAchievements() {
		SteamAchievements.playTime = 0;
		SteamAchievements.gamesWithAchievements = 0;

		SteamAchievements.playedGames = 0;
		SteamAchievements.playedGamesWithAchievements = 0;
		SteamAchievements.playedGamesAchievementCount = 0;
		SteamAchievements.playedGamesAchievementMax = 0;

		SteamAchievements.gamesWithAtLeast1 = 0;
		SteamAchievements.gamesWithAtLeast1AchievementMax = 0;

		SteamAchievements.gamesAchievementMax = 0;

		SteamAchievements.avgOfAvgTotal = 0;
		SteamAchievements.avgOfAvgPlayed = 0;
		SteamAchievements.avgOfAvg1Unlocked = 0;

		for(const game of SteamAchievements.data.games) {
			SteamAchievements.playTime += game.playtime_forever;

			if(game.playtime_forever > 0) {
				SteamAchievements.playedGames++;
			}

			if(typeof game.playerstats.achievements !== 'undefined') {
				SteamAchievements.gamesWithAchievements++;

				SteamAchievements.gamesAchievementMax += game.playerstats.achievements.length;

				if(game.playtime_forever > 0) {
					SteamAchievements.playedGamesWithAchievements++;

					const unlockedAchievements = game.playerstats.achievements.filter((ac) => ac.achieved !== 0);
					SteamAchievements.playedGamesAchievementCount += unlockedAchievements.length;

					SteamAchievements.avgOfAvgPlayed += (unlockedAchievements.length / game.playerstats.achievements.length);

					if(unlockedAchievements.length > 0) {
						SteamAchievements.gamesWithAtLeast1++;
						SteamAchievements.gamesWithAtLeast1AchievementMax += game.playerstats.achievements.length;

						SteamAchievements.avgOfAvg1Unlocked += (unlockedAchievements.length / game.playerstats.achievements.length);
					}

					SteamAchievements.playedGamesAchievementMax += game.playerstats.achievements.length;
				}
			}
		}

		SteamAchievements.avgOfAvgTotal = Math.round(100 * (SteamAchievements.avgOfAvgPlayed / SteamAchievements.gamesWithAchievements));
		SteamAchievements.avgOfAvgPlayed = Math.round(100 * (SteamAchievements.avgOfAvgPlayed / SteamAchievements.playedGamesWithAchievements));
		SteamAchievements.avgOfAvg1Unlocked = Math.round(100 * (SteamAchievements.avgOfAvg1Unlocked / SteamAchievements.gamesWithAtLeast1));
	}

	// Get Data
	static async GetAchievements(appId) {
		const result = await fetch('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=' + appId + '&key=' + API_KEY + '&steamid=' + STEAM_ID);
		const jsonRes = await result.json();

		return jsonRes;
	}

	static async GetPlayerGames() {
		const result = await fetch('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + API_KEY + '&steamid=' + STEAM_ID + '&format=json&include_appinfo=1&include_played_free_games=1');
		const jsonRes = (await result.json()).response;

		for(const gameId in jsonRes.games) {
			try {
				jsonRes.games[gameId].playerstats = (await SteamAchievements.GetAchievements(jsonRes.games[gameId].appid)).playerstats || {};
			} catch(e) {
				// Do nothing here
			}
		}

		return jsonRes;
	}

	static async fetchData() {
		SteamAchievements.data = await SteamAchievements.GetPlayerGames();
		AppDataManager.saveObject('steamAchievements', 'steamData', SteamAchievements.data);
	}
}

window.addEventListener('load', SteamAchievements.init);