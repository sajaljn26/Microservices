const Search = require("../models/Search");
const logger = require("../utils/logger");

const searchPostController = async (req, res) => {
    logger.info("Search endpoint hit");

    try {
        const { query } = req.query;

        if (!query || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Query parameter is required for search"
            });
        }

        const results = await Search.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        )
            .sort({ score: { $meta: "textScore" } })
            .limit(10);

        res.json({
            success: true,
            results,
        });

    } catch (e) {
        logger.error("Error searching post", e);
        res.status(500).json({
            success: false,
            message: "Error searching posts",
            error: e.message,
        });
    }
};

module.exports = { searchPostController };
