'use strict';
const express = require('express');
const pg = require('pg')
const cors = require('cors');
const superAgent = require('superagent');
const app = express();



require('dotenv').config();
app.use(cors());
// let client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('./public'));
const PORT = process.env.PORT;




app.set('view engine', 'ejs');
app.get('/', handleHome);
app.get('/searches/new', handleNew);
app.post('/searches', handleSearches);
app.post('/books', handleBooks);
app.get('/books/:id', handleOneBook);
// app.post('/books/:id', handleOneBook);


app.get('*', handleError);

const googleAPI = 'https://www.googleapis.com/books/v1/volumes';



function handleHome(req, res) {
    // console.log("Hello");
    client.query('SELECT * FROM books').then(data => {
        // console.log(data.rows);
        
        res.render('pages/index', { favBooks: data.rows })
    }).catch(error => {
        res.status(500).render('pages/error');
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
            let isbn = value.volumeInfo.industryIdentifiers[0].identifier;
            let authors = value.volumeInfo.authors;
            let description = value.volumeInfo.description;

            let booksObject = new Book(imgURL, title, isbn, authors, description);

            booksArray.push(booksObject);
        });
        // console.log(booksArray);
        res.render('pages/searches/show', { arrayOfItems: booksArray });

    }).catch(error => {
        res.status(500).send('there is an error    ', error);
    });
}

function handleBooks(req, res) {

    let reqBody =req.body;
    // console.log(req.body);
    let insertQuery= 'INSERT INTO books(author,title,isbn,image_url,description) VALUES ($1,$2,$3,$4,$5) RETURNING *;';

    let safeValue= [reqBody.authors,reqBody.title,reqBody.isbn,reqBody.image,reqBody.description];

    client.query(insertQuery,safeValue).then((data)=>{
        let id = data.rows[0].id;
        res.redirect(`/books/${id}`);
    }).catch(error=>{
        console.log(error)
        res.status(500).render('pages/error');
    });

}


function handleOneBook(req,res){
    // console.log('gfkufh',req.params);
    let id= req.params.id;
    let selectQuery ='SELECT * FROM books WHERE id = $1';
    let safeValues = [id];
    console.log(id);

    client.query(selectQuery,safeValues).then(data=>{
        // console.log(data);
        res.render('pages/details',{ oneBook:data.rows[0]});
    }).catch(error=>{
        res.status(500).render('pages/error');
    });
    

}

function Book(imgURL, title, isbn, authors, description) {
    this.thumbnail = imgURL || 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = title || 'there is no title';
    this.type = `ISBN: ${isbn}` || 'not found';
    this.authors = authors || 'No authors are founded';
    this.description = description || 'No description was found';
}

function handleError(req, res) {
    res.render('pages/error');
}




client.connect().then(() => {
    app.listen(PORT, () => {
      console.log('listening on port ', PORT);
    });
  }).catch((error) => {
    res.status(500).render('pages/error');
  });