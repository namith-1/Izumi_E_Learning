const Magazine = require('../required/db.js').Magazine; // Adjust the path if needed

Magazine.insertMany([
  {
    "title": "Tech Monthly",
    "description": "The latest trends and breakthroughs in the world of technology.",
    "image_url": "http://localhost:4000/views/images/test.jpeg",
    "content_url": "https://www.example.com/tech-monthly-latest-issue"
  },
  {
    "title": "Food & Travel",
    "description": "Delicious recipes and inspiring travel destinations from around the globe.",
    "image_url": "https://img.freepik.com/free-photo/digital-art-ai-technology-background_23-2151719636.jpg?t=st=1746783077~exp=1746786677~hmac=bbb0824aaaef5950bf611e346250e8ce36931ac6e0bb25469de9c5e21a54cf58&w=1800",
    "content_url": "https://www.example.com/food-travel-adventures"
  },
  {
    "title": "Science Today",
    "description": "Exploring the wonders of science, from the cosmos to the microscopic world.",
    "image_url": "http://localhost:4000/views/images/test.jpeg",
    "content_url": "https://wallpapers.com/images/high/mathematics-algebra-formulas-fvd2hz84yf8lonsz.webp"
  },
  {
    "title": "Art & Culture",
    "description": "A celebration of creativity, history, and cultural expressions.",
    "image_url": "http://localhost:4000/views/images/test.jpeg",
    "content_url": "https://www.example.com/art-culture-insights"
  },
  {
    "title": "Business Review",
    "description": "In-depth analysis and insights into the world of business and finance.",
    "image_url": "http://localhost:4000/views/images/test.jpeg",
    "content_url": "https://www.example.com/business-review-analysis"
  }
]);

exports.index = async (req, res) => {
    try {
        const magazines = await Magazine.find();
        res.render('magazine/index', { magazines: magazines });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching magazines');
    }
};