import checkAppDate from "../utils/checkAppDate.util.js";
// import dateErrorHtml from "../views/dateError.html" with { type: "text" };

const watcher = (req, res, next) => {
    // if (!checkAppDate()) return res.send(dateErrorHtml);
    next();
}

export default watcher;