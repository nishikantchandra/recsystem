// =====================================================================================
// Cosine Similarity Helper Functions
// =====================================================================================

/**
 * Calculates the dot product of two vectors.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The dot product.
 */
function dotProduct(vecA, vecB) {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

/**
 * Calculates the magnitude (length or norm) of a vector.
 * @param {number[]} vec - The vector.
 * @returns {number} The magnitude of the vector.
 */
function magnitude(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The cosine similarity score (between 0 and 1).
 */
function cosineSimilarity(vecA, vecB) {
  const dot = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  
  // To avoid division by zero error
  if (magA === 0 || magB === 0) {
    return 0;
  }
  
  return dot / (magA * magB);
}

// =====================================================================================
// Application Logic
// =====================================================================================

// Initialize the application when the window loads
window.onload = async function() {
    try {
        // Display loading message
        const resultElement = document.getElementById('result');
        resultElement.textContent = "Loading movie data...";
        resultElement.className = 'loading';
        
        // Load data
        await loadData();
        
        // Populate dropdown and update status
        populateMoviesDropdown();
        resultElement.textContent = "Data loaded. Please select a movie.";
        resultElement.className = 'success';
    } catch (error) {
        console.error('Initialization error:', error);
        // Error message is handled in data.js
    }
};

// Populate the movies dropdown with sorted movie titles
function populateMoviesDropdown() {
    const selectElement = document.getElementById('movie-select');
    
    // Clear existing options except the first placeholder
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    // Sort movies alphabetically by title
    const sortedMovies = [...movies].sort((a, b) => a.title.localeCompare(b.title));
    
    // Add movies to dropdown
    sortedMovies.forEach(movie => {
        const option = document.createElement('option');
        option.value = movie.id;
        option.textContent = movie.title;
        selectElement.appendChild(option);
    });
}

// Main recommendation function
function getRecommendations() {
    const resultElement = document.getElementById('result');
    
    try {
        // Step 1: Get user input
        const selectElement = document.getElementById('movie-select');
        const selectedMovieId = parseInt(selectElement.value);
        
        if (isNaN(selectedMovieId)) {
            resultElement.textContent = "Please select a movie first.";
            resultElement.className = 'error';
            return;
        }
        
        // Step 2: Find the liked movie
        const likedMovie = movies.find(movie => movie.id === selectedMovieId);
        if (!likedMovie) {
            resultElement.textContent = "Error: Selected movie not found in database.";
            resultElement.className = 'error';
            return;
        }
        
        // Show loading message while processing
        resultElement.textContent = "Calculating recommendations...";
        resultElement.className = 'loading';
        
        // Use setTimeout to allow the UI to update before heavy computation
        setTimeout(() => {
            try {
                // =====================================================================
                // NEW: Cosine Similarity Logic
                // =====================================================================

                // Step 3: Create a master list of all unique genres
                const allGenres = [...new Set(movies.flatMap(m => m.genres))];

                /**
                 * Creates a one-hot encoded vector from a movie's genres.
                 * @param {string[]} movieGenres - The list of genres for a single movie.
                 * @param {string[]} allGenresList - The master list of all unique genres.
                 * @returns {number[]} A binary vector.
                 */
                const createGenreVector = (movieGenres, allGenresList) => {
                    return allGenresList.map(genre => movieGenres.includes(genre) ? 1 : 0);
                };
                
                // Step 4: Create a vector for the liked movie
                const likedMovieVector = createGenreVector(likedMovie.genres, allGenres);
                
                // Step 5: Filter out the liked movie and calculate scores for all other movies
                const candidateMovies = movies.filter(movie => movie.id !== likedMovie.id);
                
                const scoredMovies = candidateMovies.map(candidate => {
                    // Create a vector for the candidate movie
                    const candidateVector = createGenreVector(candidate.genres, allGenres);
                    
                    // Calculate cosine similarity score
                    const score = cosineSimilarity(likedMovieVector, candidateVector);
                    
                    return {
                        ...candidate,
                        score: score
                    };
                });
                
                // =====================================================================
                // End of New Logic
                // =====================================================================
                
                // Step 6: Sort by score in descending order
                scoredMovies.sort((a, b) => b.score - a.score);
                
                // Step 7: Select top recommendations (we'll take 3 this time)
                const topRecommendations = scoredMovies.slice(0, 3);
                
                // Step 8: Display results
                if (topRecommendations.length > 0 && topRecommendations[0].score > 0) {
                    const recommendationTitles = topRecommendations.map(movie => movie.title);
                    resultElement.textContent = `Because you liked "${likedMovie.title}", we recommend: ${recommendationTitles.join(', ')}`;
                    resultElement.className = 'success';
                } else {
                    resultElement.textContent = `Sorry, no strong recommendations found for "${likedMovie.title}".`;
                    resultElement.className = 'error';
                }
            } catch (error) {
                console.error('Error in recommendation calculation:', error);
                resultElement.textContent = "An error occurred while calculating recommendations.";
                resultElement.className = 'error';
            }
        }, 100);
    } catch (error) {
        console.error('Error in getRecommendations:', error);
        resultElement.textContent = "An unexpected error occurred.";
        resultElement.className = 'error';
    }
}
