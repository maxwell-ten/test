var Author = require("../models/author");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const {body, validationResult} = require("express-validator");
const async = require('async');
const Genre = require("../models/genre");
const debug = require("debug")("author");

// Показать список всех авторов.
// Display list of all Authors.
exports.author_list = function (req, res, next) {
    Author.find()
        .sort([["family_name", "ascending"]])
        .exec(function (err, list_authors) {
            if (err) {
                return next(err);
            }
            //Successful, so render
            res.render("author_list", {
                title: "Author List",
                author_list: list_authors,
            });
        });
};


// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({author: req.params.id}, "title summary").exec(),
    ]);

    if (author === null) {
        // No results.
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_detail", {
        title: "Author Detail",
        author: author,
        author_books: allBooksByAuthor,
    });
});


// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
    res.render("author_form", {title: "Create Author"});
};


// Handle Author create on POST.
exports.author_create_post = [
    // Validate and sanitize fields.
    body("first_name")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({values: "falsy"})
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({values: "falsy"})
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render("author_form", {
                title: "Create Author",
                author: author,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.

            // Save author.
            await author.save();
            // Redirect to new author record.
            res.redirect(author.url);
        }
    }),
];


// Отображать форму для удаления автора GET
exports.author_delete_get = function (req, res, next) {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.params.id).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({author: req.params.id}).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.author == null) {
                // No results.
                res.redirect("/catalog/authors");
            }
            // Удачно, значит рендерим.
            res.render("author_delete", {
                title: "Delete Author",
                author: results.author,
                author_books: results.authors_books,
            });
        },
    );
};


// Обработчик удаления автора POST.
exports.author_delete_post = function (req, res, next) {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.body.authorid).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({author: req.body.authorid}).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // Success
            if (results.authors_books.length > 0) {
                // Автор книги. Визуализация выполняется так же, как и для GET route.
                res.render("author_delete", {
                    title: "Delete Author",
                    author: results.author,
                    author_books: results.authors_books,
                });
                return;
            } else {
                //У автора нет никаких книг. Удалить объект и перенаправить в список авторов.
                Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                    if (err) {
                        return next(err);
                    }
                    // Успех-перейти к списку авторов
                    res.redirect("/catalog/authors");
                });
            }
        },
    );
};


// Показать форму обновления автора по запросу GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
    const author = await Author.findById(req.params.id).exec();
    if (author === null) {
        // No results.
        debug(`id not found on update: ${req.params.id}`);
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_form", { title: "Update Author", author: author });
});

// Обновить автора по запросу POST.
exports.author_update_post = [
    // Validate and sanitize fields.
    body("first_name")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({min: 1})
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({values: "falsy"})
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({values: "falsy"})
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render("author_form", {
                title: "Update Author",
                author: author,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.

            // Save author.
            await Author.findByIdAndUpdate(req.params.id, author);

                res.redirect(author.url);

        }
    }),
];