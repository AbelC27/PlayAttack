from django.core.management.base import BaseCommand
from app.models import Game


class Command(BaseCommand):
    help = 'Populate the database with 20 games'

    def handle(self, *args, **kwargs):
        games_data = [
            {
                'name': 'minecraft',
                'display_name': 'Minecraft',
                'image_url': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
                'description': 'A sandbox video game where players can build and explore blocky, procedurally generated 3D worlds.',
                'genre': 'Sandbox',
                'is_active': True
            },
            {
                'name': 'fortnite',
                'display_name': 'Fortnite',
                'image_url': 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=500',
                'description': 'A popular battle royale game where 100 players fight to be the last one standing.',
                'genre': 'Battle Royale',
                'is_active': True
            },
            {
                'name': 'valorant',
                'display_name': 'Valorant',
                'image_url': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
                'description': 'A tactical first-person shooter with character-based abilities and strategic gameplay.',
                'genre': 'FPS',
                'is_active': True
            },
            {
                'name': 'league-of-legends',
                'display_name': 'League of Legends',
                'image_url': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
                'description': 'A multiplayer online battle arena game where two teams of champions battle for victory.',
                'genre': 'MOBA',
                'is_active': True
            },
            {
                'name': 'cs2',
                'display_name': 'Counter-Strike 2',
                'image_url': 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=500',
                'description': 'The latest iteration of the legendary tactical shooter series with enhanced graphics and gameplay.',
                'genre': 'FPS',
                'is_active': True
            },
            {
                'name': 'dota2',
                'display_name': 'Dota 2',
                'image_url': 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=500',
                'description': 'A complex and strategic multiplayer online battle arena game with deep tactical gameplay.',
                'genre': 'MOBA',
                'is_active': True
            },
            {
                'name': 'apex-legends',
                'display_name': 'Apex Legends',
                'image_url': 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=500',
                'description': 'A free-to-play battle royale game with unique character abilities and team-based combat.',
                'genre': 'Battle Royale',
                'is_active': True
            },
            {
                'name': 'overwatch2',
                'display_name': 'Overwatch 2',
                'image_url': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
                'description': 'A team-based multiplayer shooter featuring diverse heroes with unique abilities.',
                'genre': 'FPS',
                'is_active': True
            },
            {
                'name': 'rocket-league',
                'display_name': 'Rocket League',
                'image_url': 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=500',
                'description': 'A high-powered hybrid of arcade-style soccer and vehicular mayhem.',
                'genre': 'Sports',
                'is_active': True
            },
            {
                'name': 'gta-v',
                'display_name': 'Grand Theft Auto V',
                'image_url': 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=500',
                'description': 'An action-adventure game with an open world setting and both single-player and multiplayer modes.',
                'genre': 'Action-Adventure',
                'is_active': True
            },
            {
                'name': 'roblox',
                'display_name': 'Roblox',
                'image_url': 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=500',
                'description': 'A platform for creating and playing user-generated games with millions of experiences to explore.',
                'genre': 'Platform',
                'is_active': True
            },
            {
                'name': 'world-of-warcraft',
                'display_name': 'World of Warcraft',
                'image_url': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500',
                'description': 'A massively multiplayer online role-playing game set in the fantasy world of Azeroth.',
                'genre': 'MMORPG',
                'is_active': True
            },
            {
                'name': 'pubg',
                'display_name': 'PUBG: Battlegrounds',
                'image_url': 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=500',
                'description': 'The original battle royale game where up to 100 players fight on a shrinking battlefield.',
                'genre': 'Battle Royale',
                'is_active': True
            },
            {
                'name': 'destiny2',
                'display_name': 'Destiny 2',
                'image_url': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500',
                'description': 'A free-to-play online-only multiplayer first-person shooter with MMO elements.',
                'genre': 'FPS/MMO',
                'is_active': True
            },
            {
                'name': 'warzone',
                'display_name': 'Call of Duty: Warzone',
                'image_url': 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500',
                'description': 'A free-to-play battle royale game set in the Call of Duty universe.',
                'genre': 'Battle Royale',
                'is_active': True
            },
            {
                'name': 'rainbow-six-siege',
                'display_name': 'Rainbow Six Siege',
                'image_url': 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=500',
                'description': 'A tactical shooter emphasizing environmental destruction and close-quarters combat.',
                'genre': 'Tactical Shooter',
                'is_active': True
            },
            {
                'name': 'among-us',
                'display_name': 'Among Us',
                'image_url': 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=500',
                'description': 'A social deduction game where players work together to find the impostor among the crew.',
                'genre': 'Party/Social',
                'is_active': True
            },
            {
                'name': 'fall-guys',
                'display_name': 'Fall Guys',
                'image_url': 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500',
                'description': 'A massively multiplayer party game with chaotic obstacle courses and hilarious physics.',
                'genre': 'Party',
                'is_active': True
            },
            {
                'name': 'rust',
                'display_name': 'Rust',
                'image_url': 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=500',
                'description': 'A survival game where you must gather resources, build shelters, and defend against threats.',
                'genre': 'Survival',
                'is_active': True
            },
            {
                'name': 'terraria',
                'display_name': 'Terraria',
                'image_url': 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=500',
                'description': 'A 2D sandbox adventure game with exploration, crafting, and building mechanics.',
                'genre': 'Sandbox/Adventure',
                'is_active': True
            },
        ]

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for game_data in games_data:
            game, created = Game.objects.get_or_create(
                name=game_data['name'],
                defaults={
                    'display_name': game_data['display_name'],
                    'image_url': game_data['image_url'],
                    'description': game_data['description'],
                    'genre': game_data['genre'],
                    'is_active': game_data['is_active']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {game.display_name}')
                )
            else:
                # Update existing game with new data
                updated = False
                for key, value in game_data.items():
                    if key != 'name' and getattr(game, key) != value:
                        setattr(game, key, value)
                        updated = True
                
                if updated:
                    game.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'↻ Updated: {game.display_name}')
                    )
                else:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.NOTICE(f'- Skipped (already exists): {game.display_name}')
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n═══════════════════════════════════════\n'
                f'Summary:\n'
                f'  Created: {created_count}\n'
                f'  Updated: {updated_count}\n'
                f'  Skipped: {skipped_count}\n'
                f'  Total:   {created_count + updated_count + skipped_count}\n'
                f'═══════════════════════════════════════'
            )
        )
