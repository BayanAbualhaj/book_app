'use strict';
const express = require('express');
const pg = require('pg')
const cors = require('cors');
const superAgent = require('superagent');
let client = new pg.Client(process.env.DATABASE_URL)
const app = express();



require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('./public'));
const PORT = process.env.PORT;



app.set('view engine', 'ejs');
app.get('/', handleHome);
app.get('/searches/new', handleNew);
app.post('/searches', handleSearches);
app.post('/books',handleBooks);
app.get('*', handleError);

const googleAPI = 'https://www.googleapis.com/books/v1/volumes';

function handleHome(req, res) {
    client.query(`SELECT * FROM books`).then(data => {
        // console.log(data);
        res.render('pages/index', { favBooks: data.rows })
    }).catch(error => {
        res.status(500).render('error');
    });
}


function handleNew(req, res) {
    res.render('pages/searches/new');
}

function handleSearches(req, res) {
    let searchQuery = req.body.searchQuery;
    let searchWith = req.body.searchBy;
    let que = "+in" + searchWith + ":" + searchQuery;

    let query = {
        q: que
    };

    superAgent.get(googleAPI).query(query).then(data => {

        let booksArray = [];
        data.body.items.map((value) => {

            let imgURL = value.volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
            let title = value.volumeInfo.title;
            let isbn = value.volumeInfo.industryIdentifiers[0].type;
            let authors = value.volumeInfo.authors;
            let description = value.volumeInfo.description;

            let booksObject = new Book(imgURL, title,isbn, authors, description);

            booksArray.push(booksObject);
        });
        // console.log(booksArray);
        res.render('pages/searches/show', { arrayOfItems: booksArray });

    }).catch(error => {
        res.status(500).send('there is an error    ', error);
    });
}

function handleBooks(req,res){
    console.log(req);
    let reqBody = req.body;
    // let insertQuery = 'INSERT INTO books('
}


function Book(imgURL, title,isbn, authors, description) {
    this.thumbnail = imgURL || 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = title || 'there is no title';
    this.type = isbn || 'not found';
    this.authors = authors || 'No authors are founded';
    this.description = description || 'No description was found';
}

function handleError(req, res) {
    res.render('pages/error');
}


app.listen(PORT, () => {
    console.log('server is running on port', PORT);
});