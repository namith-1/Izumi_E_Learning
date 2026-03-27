// v2/src/pages/StudentCourse/EducationalGames.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronLeft, Gamepad2 } from 'lucide-react';
import '../css/EducationalGames.css'; 

// The educational game data structure extracted from test_just.html
const gameData = {
    "Math": {
        "title": "Explore Mathematical Concepts",
        "description": "Engaging games to learn and practice various mathematical topics.",
        "games": [
            {
                "title": "Calculus Grapher (PhET)",
                "description": "Visualize functions, derivatives, and integrals.",
                "url": "https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_en.html",
                "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBgW-xTZCEQeRxGFmv6wIUgeTvGtto6uOH6g&s"
            },
            {
                "title": "Graphing Lines (PhET)",
                "description": "Explore how the slope and y-intercept affect linear graphs.",
                "url": "https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_en.html",
                "image": "https://media.geeksforgeeks.org/wp-content/uploads/20240917170702/Function-in-Maths.webp"
            },
            {
                "title": "Function Builder (PhET)",
                "description": "Build your own functions and see their graphs.",
                "url": "https://phet.colorado.edu/sims/html/function-builder/latest/function-builder_en.html",
                "image": "https://cdn.britannica.com/88/62088-004-8245C6C2/graph-curve-calculus-help-steps-x-shape.jpg"
            },
            {
                "title": "Number Line (PhET)",
                "description": "Explore integers, fractions, decimals, and number operations on a number line.",
                "url": "https://phet.colorado.edu/sims/html/number-line/latest/number-line_en.html",
                "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRk2SIGSFYsIkjQopNDNCwD_SZOupH9eO36w&s"
            },
            {
                "title": "Geometric Shapes (Interactive)",
                "description": "Identify and learn about different geometric shapes.",
                "url": "https://www.mathlearningcenter.org/apps/geoboard",
                "image": "https://snu.edu.in/site/assets/files/16719/34087903_math_6.1600x0.webp"
            }
        ]
    },
    "Science": {
        "title": "Discover the Wonders of Science",
        "description": "Interactive games and simulations to explore different scientific fields.",
        "games": [
            {
                "title": "Projectile Motion (PhET)",
                "description": "Learn about trajectory, velocity, and gravity.",
                "url": "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html",
                "image": "https://images.unsplash.com/photo-1612282129478-4d2b0ecca6f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Energy Forms and Changes (PhET)",
                "description": "Explore different forms of energy and how they can be converted.",
                "url": "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html",
                "image": "https://images.unsplash.com/photo-1517976487497-9d721418a3f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "States of Matter (PhET)",
                "description": "Investigate the behavior of atoms and molecules in different states of matter.",
                "url": "https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_en.html",
                "image": "https://images.unsplash.com/photo-1635078649988-c28865e359a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Human Body (Interactive)",
                "description": "Explore the different systems of the human body.",
                "url": "https://www.visiblebody.com/",
                "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            }
        ],
        "sub_subjects": {
            "Biology": {
                "title": "Delve into Biology",
                "description": "Explore the fascinating world of living organisms.",
                "games": [
                    {
                        "title": "Cell Biology (Interactive)",
                        "description": "Explore the structure and function of cells.",
                        "url": "https://www.purposegames.com/game/cell-biology-interactive-diagram-quiz",
                        "image": "https://images.unsplash.com/photo-1592334590737-4c7c78fccc42?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        "title": "The Virtual Body (Interactive)",
                        "description": "An interactive exploration of human anatomy.",
                        "url": "https://www.medtropolis.com/vbody.asp",
                        "image": "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    }
                ]
            },
            "Chemistry": {
                "title": "Unravel the Mysteries of Chemistry",
                "description": "Explore the composition, structure, properties, and reactions of matter.",
                "games": [
                    {
                        "title": "Balancing Chemical Equations (PhET)",
                        "description": "Learn how to balance chemical equations through an interactive game.",
                        "url": "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html",
                        "image": "https://images.unsplash.com/photo-1621293954908-907159247fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        "title": "Molecule Shapes (PhET)",
                        "description": "Explore three-dimensional molecular shapes by bonding atoms.",
                        "url": "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html",
                        "image": "https://images.unsplash.com/photo-1630369161088-8137849db02f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    }
                ]
            }
        }
    },
    "Physics": {
        "title": "Explore the Principles of Physics",
        "description": "Interactive simulations to understand the fundamental laws of physics.",
        "games": [
            {
                "title": "Motion 1D (PhET)",
                "description": "Explore position, velocity, and acceleration in one dimension.",
                "url": "https://phet.colorado.edu/sims/html/motion-1d/latest/motion-1d_en.html",
                "image": "https://images.unsplash.com/photo-1614036634955-7b7177f84315?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Forces and Motion: Basics (PhET)",
                "description": "Investigate net force, friction, and acceleration.",
                "url": "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html",
                "image": "https://images.unsplash.com/photo-1635944093606-0deb44e9ebb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Circuit Construction Kit: DC (PhET)",
                "description": "Build and experiment with DC electrical circuits.",
                "url": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html",
                "image": "https://images.unsplash.com/photo-1516321165247-7b6f2721e8c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    "CS": {
        "title": "Dive into Computer Science",
        "description": "Coding challenges and interactive tools to understand computer science principles.",
        "games": [
            {
                "title": "Blockly Maze",
                "description": "Learn fundamental programming concepts with block-based puzzles.",
                "url": "https://blockly.games/maze?lang=en",
                "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            },
            {
                "title": "Code.org - Hour of Code",
                "description": "Engaging coding activities for all skill levels.",
                "url": "https://hourofcode.com/us/learn",
                "image": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            }
        ],
        "sub_subjects": {
            "Web Development": {
                "title": "Explore Web Development",
                "description": "Learn the basics of building websites.",
                "games": [
                    {
                        "title": "Codecademy - HTML & CSS",
                        "description": "Interactive lessons on HTML and CSS fundamentals.",
                        "url": "https://www.codecademy.com/learn/learn-html",
                        "image": "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb50?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    },
                    {
                        "title": "Khan Academy - HTML, CSS, JS",
                        "description": "Learn web development through videos and interactive exercises.",
                        "url": "https://www.khanacademy.org/computing/computer-programming/html-css",
                        "image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    }
                ]
            }
        }
    }
};

// Utility function to flatten all games for search
const getAllGames = () => {
    let games = [];
    for (const subjectKey in gameData) {
        const subject = gameData[subjectKey];
        games.push(...(subject.games || []));
        if (subject.sub_subjects) {
            for (const subKey in subject.sub_subjects) {
                games.push(...(subject.sub_subjects[subKey].games || []));
            }
        }
    }
    return games;
};

const allGames = getAllGames();
const subjectKeys = Object.keys(gameData);
const defaultSubject = subjectKeys[0];

const EducationalGames = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSubject, setActiveSubject] = useState(defaultSubject);
    const [gameFrameUrl, setGameFrameUrl] = useState(null);
    
    // --- Callbacks/Memoized Data ---
    const filterGames = useCallback((term, subject) => {
        const lowerTerm = term.toLowerCase();
        let gamesToFilter;

        // If a search term is active, search all games
        if (lowerTerm.length > 0) {
            gamesToFilter = allGames;
        } else if (subject && gameData[subject]) {
            // If filtering by subject, collect all games from the main subject and its sub-subjects
            gamesToFilter = [...(gameData[subject].games || [])];
            if (gameData[subject].sub_subjects) {
                for (const subKey in gameData[subject].sub_subjects) {
                    gamesToFilter.push(...(gameData[subject].sub_subjects[subKey].games || []));
                }
            }
        } else {
            // Fallback to all games
            return allGames;
        }

        // Apply search filter to the selected group of games
        return gamesToFilter.filter(game => 
            game.title.toLowerCase().includes(lowerTerm) || 
            game.description.toLowerCase().includes(lowerTerm)
        );
    }, [allGames]);

    const filteredGames = useMemo(() => {
        return filterGames(searchTerm, activeSubject);
    }, [searchTerm, activeSubject, filterGames]);
    
    // Auto-select first subject or clear subject when searching
    useEffect(() => {
        if (searchTerm) {
             setActiveSubject(null);
        } else if (!activeSubject && defaultSubject) {
             setActiveSubject(defaultSubject);
        }
    }, [searchTerm, activeSubject]);

    // --- Handlers ---
    
    const handleSubjectClick = (subject) => {
        setActiveSubject(subject);
        setSearchTerm(''); // Clear search when selecting a subject
    };

    const handlePlayGame = (url) => {
        setGameFrameUrl(url);
    };

    const handleBackToGames = () => {
        setGameFrameUrl(null);
    };
    
    // --- Render Components ---

    const renderGameCards = () => {
        if (filteredGames.length === 0) {
            return (
                <div className="no-results">
                    <p>No games found matching your criteria.</p>
                </div>
            );
        }

        return (
            <div className="game-cards-container">
                {/* Only show the header if not actively searching */}
                {searchTerm.length === 0 && activeSubject && gameData[activeSubject] && (
                    <div className="subject-header">
                        <h2>{gameData[activeSubject].title}</h2>
                        <p>{gameData[activeSubject].description}</p>
                    </div>
                )}
                {filteredGames.map((game, index) => (
                    <div key={index} className="game-card">
                        <div className="game-image">
                            <img src={game.image || 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} alt={game.title} />
                        </div>
                        <div className="game-info">
                            <h3 className="game-title">{game.title}</h3>
                            <p className="game-short-desc">{game.description}</p>
                            <button 
                                className="play-button"
                                onClick={() => handlePlayGame(game.url)}
                            >
                                Play
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // --- Main Render ---
    return (
        <div className="educational-games-page">
            <div className="dashboard-intro">
                <h1>Educational Games & Simulations</h1>
                <p className="text-gray-600">Interact with fun simulations to enhance your learning.</p>
            </div>
            
            {gameFrameUrl ? (
                // Case 1: Iframe View (Game is playing)
                <div className="game-iframe-container" style={{ display: 'flex' }}>
                    <button className="back-button" onClick={handleBackToGames}>
                        <ChevronLeft size={16} /> Back to Games
                    </button>
                    <iframe className="game-iframe" src={gameFrameUrl} title="Educational Game" allowFullScreen frameBorder="0"></iframe>
                </div>
            ) : (
                // Case 2: Catalog View (Browsing)
                <>
                    <div className="search-container">
                        <input 
                            type="text" 
                            id="searchInput" 
                            className="search-input" 
                            placeholder="Search games..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="search-button" onClick={() => {}}>
                            <Search size={20} />
                        </button>
                    </div>

                    <div className="subject-list-container">
                        {subjectKeys.map(subject => (
                            <button
                                key={subject}
                                className={`subject-button ${subject === activeSubject ? 'active' : ''}`}
                                onClick={() => handleSubjectClick(subject)}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>
                    
                    {renderGameCards()}
                </>
            )}
        </div>
    );
};

export default EducationalGames;