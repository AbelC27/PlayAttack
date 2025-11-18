import React, { useState, useMemo } from 'react';

const EnhancedGameSearch = ({ games, onFilteredGames, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Extract unique genres from games and create categories
  const categories = useMemo(() => {
    const genreMap = {
      'FPS': { emoji: '🎯', name: 'FPS' },
      'MOBA': { emoji: '⚔️', name: 'MOBA' },
      'Battle Royale': { emoji: '🏆', name: 'Battle Royale' },
      'Sandbox': { emoji: '🏗️', name: 'Sandbox' },
      'Sports': { emoji: '⚽', name: 'Sports' },
      'Action-Adventure': { emoji: '🗺️', name: 'Action-Adventure' },
      'Platform': { emoji: '🎮', name: 'Platform' },
      'MMORPG': { emoji: '🧙‍♂️', name: 'MMORPG' },
      'FPS/MMO': { emoji: '🎯', name: 'FPS/MMO' },
      'Tactical Shooter': { emoji: '🎖️', name: 'Tactical Shooter' },
      'Party/Social': { emoji: '�', name: 'Party/Social' },
      'Party': { emoji: '🎊', name: 'Party' },
      'Survival': { emoji: '🏕️', name: 'Survival' },
      'Sandbox/Adventure': { emoji: '⛏️', name: 'Sandbox/Adventure' }
    };

    // Start with "All Games"
    const allCategories = [{ id: 'all', name: 'All Games', emoji: '🎮' }];
    
    // Extract unique genres from games
    if (games && games.length > 0) {
      const uniqueGenres = [...new Set(games.map(game => game.genre).filter(Boolean))];
      uniqueGenres.sort().forEach(genre => {
        const genreInfo = genreMap[genre] || { emoji: '🎲', name: genre };
        allCategories.push({
          id: genre,
          name: genreInfo.name,
          emoji: genreInfo.emoji
        });
      });
    }
    
    return allCategories;
  }, [games]);

  const sortOptions = [
    { id: 'name', name: 'Name A-Z', emoji: '🔤' },
    { id: 'genre', name: 'By Genre', emoji: '🎯' },
    { id: 'newest', name: 'Newest First', emoji: '✨' }
  ];

  const filteredAndSortedGames = useMemo(() => {
    if (!games || games.length === 0) return [];

    let filtered = games.filter(game => {
      const matchesSearch = game.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || game.genre === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Enhanced sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.display_name || a.name).localeCompare(b.display_name || b.name);
        case 'genre':
          return (a.genre || '').localeCompare(b.genre || '');
        case 'newest':
          return new Date(b.added_date || 0) - new Date(a.added_date || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [games, searchTerm, selectedCategory, sortBy]);

  React.useEffect(() => {
    if (onFilteredGames) {
      onFilteredGames(filteredAndSortedGames);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAndSortedGames]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('name');
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b35 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #333'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem' }}>
          <div style={{
            height: '48px',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '8px'
          }}></div>
          <div style={{
            height: '48px',
            width: '150px',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '8px'
          }}></div>
          <div style={{
            height: '48px',
            width: '150px',
            background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '8px'
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b35 100%)',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      border: '1px solid #333',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }}></div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            color: '#fff',
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🔍</span> Game Discovery
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* View Mode Toggle */}
            <div style={{
              background: '#2a2a2a',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid #444'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? '#22c55e' : 'transparent',
                  color: viewMode === 'grid' ? '#000' : '#ccc',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                title="Grid View"
              >
                🔳
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? '#22c55e' : 'transparent',
                  color: viewMode === 'list' ? '#000' : '#ccc',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                title="List View"
              >
                📋
              </button>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedCategory !== 'all' || sortBy !== 'name') && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ef4444';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#ef4444';
                }}
              >
                ✕ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto auto',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          {/* Enhanced Search Input */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#888',
              fontSize: '1.1rem',
              pointerEvents: 'none'
            }}>
              🔍
            </div>
            <input
              type="text"
              placeholder="Search games by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: '#2a2a2a',
                border: searchTerm ? '2px solid #22c55e' : '1px solid #444',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                if (!searchTerm) e.target.style.border = '2px solid #3b82f6';
              }}
              onBlur={(e) => {
                if (!searchTerm) e.target.style.border = '1px solid #444';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              background: '#2a2a2a',
              border: selectedCategory !== 'all' ? '2px solid #f59e0b' : '1px solid #444',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.95rem',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.emoji} {category.name}
              </option>
            ))}
          </select>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              background: '#2a2a2a',
              border: sortBy !== 'name' ? '2px solid #8b5cf6' : '1px solid #444',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.95rem',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.emoji} {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Results Summary */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: 'rgba(42, 42, 42, 0.5)',
          borderRadius: '8px',
          border: '1px solid #444',
          marginBottom: '1rem'
        }}>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
              {filteredAndSortedGames.length}
            </span> of{' '}
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
              {games?.length || 0}
            </span> games
            {searchTerm && (
              <span> matching "<span style={{ color: '#f59e0b' }}>{searchTerm}</span>"</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {selectedCategory !== 'all' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                border: '1px solid #f59e0b'
              }}>
                {categories.find(c => c.id === selectedCategory)?.emoji}{' '}
                {categories.find(c => c.id === selectedCategory)?.name}
              </div>
            )}

            {sortBy !== 'name' && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#8b5cf6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                border: '1px solid #8b5cf6'
              }}>
                {sortOptions.find(s => s.id === sortBy)?.emoji}{' '}
                {sortOptions.find(s => s.id === sortBy)?.name}
              </div>
            )}
          </div>
        </div>

        {/* No Results Message */}
        {filteredAndSortedGames.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: '#888'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
            <h4 style={{ color: '#ccc', marginBottom: '0.5rem' }}>No games found</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Try adjusting your search terms or filters
            </p>
            {(searchTerm || selectedCategory !== 'all' || sortBy !== 'name') && (
              <button
                onClick={clearFilters}
                style={{
                  background: '#22c55e',
                  color: '#000',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginTop: '1rem'
                }}
              >
                🔄 Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedGameSearch;