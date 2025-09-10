<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Jeopardy</title>
  <link href="https://fonts.googleapis.com/css?family=Copse&display=swap"
        rel="stylesheet">
  <style>
    /* Jeopardy Game Styles */
    body {
      font-family: 'Copse', serif;
      background: linear-gradient(135deg, #115ff4, #060ce9);
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      color: white;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      text-align: center;
    }

    h1 {
      font-size: 3em;
      margin-bottom: 30px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }

    #jeopardy {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }

    #jeopardy th {
      background: linear-gradient(135deg, #28a200, #74119c);
      color: white;
      padding: 20px 10px;
      font-size: 1.2em;
      font-weight: bold;
      text-transform: uppercase;
      border: 2px solid #fff;
    }

    #jeopardy td {
      background: linear-gradient(135deg, #8d2ab5, #74119c);
      color: white;
      padding: 30px 10px;
      font-size: 2em;
      font-weight: bold;
      border: 2px solid #fff;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 80px;
      vertical-align: middle;
    }

    #jeopardy td:hover {
      background: linear-gradient(135deg, #a040d0, #8020b0);
      transform: scale(1.05);
    }

    #jeopardy td.showing-question {
      font-size: 1em;
      background: linear-gradient(135deg, #115ff4, #060ce9);
      padding: 15px;
      line-height: 1.4;
    }

    #jeopardy td.showing-answer {
      font-size: 1em;
      background: linear-gradient(135deg, #28a200, #1a6600);
      padding: 15px;
      line-height: 1.4;
    }

    .controls {
      margin: 30px 0;
    }

    button {
      background: linear-gradient(135deg, #28a200, #1a6600);
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 1.2em;
      font-weight: bold;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }

    button:hover {
      background: linear-gradient(135deg, #32b000, #1e7200);
      transform: translateY(-2px);
      box-shadow: 0 7px 20px rgba(0,0,0,0.4);
    }

    button:disabled {
      background: #666;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .loading {
      display: none;
      font-size: 1.5em;
      margin: 20px 0;
    }

    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 4px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error {
      color: #ff6b6b;
      background: rgba(255,107,107,0.1);
      border: 2px solid #ff6b6b;
      border-radius: 10px;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Jeopardy!</h1>
    
    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>Loading categories and questions...</p>
    </div>
    
    <div id="error-message" class="error" style="display: none;"></div>
    
    <table id="jeopardy" style="display: none;">
      <thead id="jeopardy-head">
      </thead>
      <tbody id="jeopardy-body">
      </tbody>
    </table>
    
    <div class="controls">
      <button id="start-btn">Start Game!</button>
    </div>
  </div>

  <script src="https://unpkg.com/jquery"></script>
  <script src="https://unpkg.com/axios/dist/axios.js"></script>
  <script src="https://unpkg.com/lodash"></script>
  
  <script>
    // Constants
    const NUM_CATEGORIES = 6;
    const NUM_QUESTIONS_PER_CAT = 5;
    
    // categories is the main data structure for the app
    let categories = [];

    /** Get NUM_CATEGORIES random category from API.
     * Returns array of category ids
     */
    async function getCategoryIds() {
      try {
        // Get a larger number of categories to have more to choose from
        const response = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/categories?count=100`);
        
        // Use lodash to sample random categories
        const randomCategories = _.sampleSize(response.data, NUM_CATEGORIES);
        
        // Return array of category IDs
        return randomCategories.map(cat => cat.id);
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Failed to fetch categories. Please try again.");
      }
    }

    /** Return object with data about a category:
     * Returns { title: "Math", clues: clue-array }
     * Where clue-array is:
     *   [
     *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
     *      {question: "Bell Jar Author", answer: "Plath", showing: null},
     *      ...
     *   ]
     */
    async function getCategory(catId) {
      try {
        const response = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/category?id=${catId}`);
        const categoryData = response.data;
        
        // Get random clues from this category (up to NUM_QUESTIONS_PER_CAT)
        const randomClues = _.sampleSize(categoryData.clues, NUM_QUESTIONS_PER_CAT);
        
        // Format clues for our app
        const clues = randomClues.map(clue => ({
          question: clue.question,
          answer: clue.answer,
          showing: null
        }));
        
        return {
          title: categoryData.title,
          clues: clues
        };
      } catch (error) {
        console.error(`Error fetching category ${catId}:`, error);
        throw new Error(`Failed to fetch category data for ID ${catId}`);
      }
    }

    /** Fill the HTML table#jeopardy with the categories & cells for questions.
     * - The <thead> should be filled w/a <tr>, and a <td> for each category
     * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
     *   each with a question for each category in a <td>
     *   (initially, just show a "?" where the question/answer would go.)
     */
    function fillTable() {
      const $table = $("#jeopardy");
      const $head = $("#jeopardy-head");
      const $body = $("#jeopardy-body");
      
      // Clear existing content
      $head.empty();
      $body.empty();
      
      // Create header row with category titles
      const $headerRow = $("<tr>");
      for (let category of categories) {
        $headerRow.append($(`<th>${category.title}</th>`));
      }
      $head.append($headerRow);
      
      // Create body rows with question cells
      for (let clueIdx = 0; clueIdx < NUM_QUESTIONS_PER_CAT; clueIdx++) {
        const $row = $("<tr>");
        for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
          const $cell = $(`<td data-cat-idx="${catIdx}" data-clue-idx="${clueIdx}">?</td>`);
          $row.append($cell);
        }
        $body.append($row);
      }
      
      $table.show();
    }

    /** Handle clicking on a clue: show the question or answer.
     * Uses .showing property on clue to determine what to show:
     * - if currently null, show question & set .showing to "question"
     * - if currently "question", show answer & set .showing to "answer"
     * - if currently "answer", ignore click
     */
    function handleClick(evt) {
      const $cell = $(evt.target);
      const catIdx = parseInt($cell.data("cat-idx"));
      const clueIdx = parseInt($cell.data("clue-idx"));
      
      // Get the clue object
      const clue = categories[catIdx].clues[clueIdx];
      
      if (clue.showing === null) {
        // Show question
        clue.showing = "question";
        $cell.text(clue.question);
        $cell.removeClass().addClass("showing-question");
      } else if (clue.showing === "question") {
        // Show answer
        clue.showing = "answer";
        $cell.text(clue.answer);
        $cell.removeClass().addClass("showing-answer");
      }
      // If showing === "answer", do nothing (ignore click)
    }

    /** Wipe the current Jeopardy board, show the loading spinner,
     * and update the button used to fetch data.
     */
    function showLoadingView() {
      $("#loading").show();
      $("#jeopardy").hide();
      $("#error-message").hide();
      $("#start-btn").prop("disabled", true).text("Loading...");
    }

    /** Remove the loading spinner and update the button used to fetch data. */
    function hideLoadingView() {
      $("#loading").hide();
      $("#start-btn").prop("disabled", false).text("Restart Game!");
    }

    /** Start game:
     * - get random category Ids
     * - get data for each category
     * - create HTML table
     */
    async function setupAndStart() {
      try {
        showLoadingView();
        
        // Get random category IDs
        const categoryIds = await getCategoryIds();
        
        // Get data for each category
        categories = [];
        for (let catId of categoryIds) {
          const category = await getCategory(catId);
          categories.push(category);
        }
        
        // Fill the table with categories and questions
        fillTable();
        
        hideLoadingView();
      } catch (error) {
        console.error("Error setting up game:", error);
        $("#error-message").text(error.message).show();
        $("#loading").hide();
        $("#start-btn").prop("disabled", false).text("Try Again");
      }
    }

    /** On click of start / restart button, set up game. */
    $("#start-btn").on("click", setupAndStart);

    /** On page load, add event handler for clicking clues */
    $(document).on("click", "#jeopardy td", handleClick);

    // Start the game when page loads
    $(document).ready(function() {
      // Game will start when user clicks the button
    });
  </script>
</body>
</html>
