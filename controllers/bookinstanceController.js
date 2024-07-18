var BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const {body, validationResult} = require("express-validator");
const {sanitizeBody} = require("express-validator");
var Book = require("../models/book");
const async = require("async");
const Author = require("../models/author");
const Genre = require("../models/genre");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
    BookInstance.find()
        .populate("book")
        .exec(function (err, list_bookinstances) {
            if (err) {
                return next(err);
            }
            // Successful, so render
            res.render("bookinstance_list", {
                title: "Book Instance List",
                bookinstance_list: list_bookinstances,
            });
        });
};

// Display detail page for a specific BookInstance.
// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    if (bookInstance === null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_detail", {
        title: "Book:",
        bookinstance: bookInstance,
    });
});


// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
    Book.find({}, "title").exec(function (err, books) {
        if (err) {
            return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
            title: "Create BookInstance",
            book_list: books,
        });
    });
};


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate fields.
    body("book", "Book must be specified").isLength({min: 1}).trim(),
    body("imprint", "Imprint must be specified").isLength({min: 1}).trim(),
    body("due_back", "Invalid date").optional({checkFalsy: true}).isISO8601(),

    // Sanitize fields.
    sanitizeBody("book").escape(),
    sanitizeBody("imprint").escape(),
    sanitizeBody("status").trim().escape(),
    sanitizeBody("due_back").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, "title").exec(function (err, books) {
                if (err) {
                    return next(err);
                }
                // Successful, so render.
                res.render("bookinstance_form", {
                    title: "Create BookInstance",
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                });
            });
            return;
        } else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            });
        }
    },
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    // Get details of genre and all associated books (in parallel)
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec();

    if (bookInstance === null) {
        // No results.
        res.redirect("/catalog/bookinstances");
    }

    res.render("bookinstance_delete", {
        title: "Delete BookInstance",
        bookinstance: bookInstance,
    });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    // Assume valid BookInstance id in field.
    await BookInstance.findByIdAndDelete(req.body.id);
    res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
    Book.find({}, "title").exec(function (err, books) {
        if (err) {
            return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
            title: "Update BookInstance",
            book_list: books,
        });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate fields.
    body("book", "Book must be specified").isLength({min: 1}).trim().escape(),
    body("imprint", "Imprint must be specified").isLength({min: 1}).trim().escape(),
    body("status").escape(),
    body("due_back", "Invalid date").optional({ values: "falsy" }).isISO8601().toDate(),


    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            const allBooks = await Book.find({}, "title").exec();
                // Successful, so render.
                res.render("bookinstance_form", {
                    title: "Create BookInstance",
                    book_list: allBooks,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,

            });
            return;
        } else {
            // Data from form is valid.
            await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
            // Successful - redirect to new record.
            res.redirect(bookinstance.url);
        }
    }),
];