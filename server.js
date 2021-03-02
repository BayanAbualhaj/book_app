'use strict';
const express = require('express');
const pg = require('pg')
const cors = require('cors');
const superAgent = require('superagent');
const override= require('method-override');
const app = express();

require('dotenv').config();


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('./public'));
app.use(override('_method'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT;

// let client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });



app.get('/', handleHome);
app.get('/searches/new', handleNew);
app.post('/searches', handleSearches);
app.post('/books', handleBooks);
app.get('/books/:id', handleOneBook);
app.delete('/delete/:id', handleDelete);
app.put('/update/:id', handleUpdate);
app.get('*', handleError);

const googleAPI = 'https://www.googleapis.com/books/v1/volumes';

//=====================Handle Home=====================

function handleHome(req, res) {
    client.query('SELECT * FROM books').then(data => {
      
        res.render('pages/index', { favBooks: data.rows })
    }).catch(error => {
        res.status(500).render('pages/error');
    });
}

//==================Handle New search=====================

function handleNew(req, res) {
    res.render('pages/searches/new');
}

//===================Handle searches=========================
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
        res.render('pages/searches/show', { arrayOfItems: booksArray });

    }).catch(error => {
        res.status(500).send('there is an error    ', error);
    });
}

//===================Handle Books=====================

function handleBooks(req, res) {

    let reqBody =req.body;
    let insertQuery= 'INSERT INTO books(author,title,isbn,image_url,description) VALUES ($1,$2,$3,$4,$5) RETURNING *;';

    let safeValue= [reqBody.authors,reqBody.title,reqBody.isbn,reqBody.image,reqBody.description];

    client.query(insertQuery,safeValue).then((data)=>{
        let id = data.rows[0].id;
        res.redirect(`/books/${id}`);
    }).catch(error=>{
        res.status(500).render('pages/error');
    });

}

//=====================Handle One Book===================

function handleOneBook(req,res){

    let id= req.params.id;
    let selectQuery ='SELECT * FROM books WHERE id = $1';
    let safeValues = [id];

    client.query(selectQuery,safeValues).then(data=>{
        res.render('pages/details',{ oneBook:data.rows[0]});
    }).catch(error=>{
        res.status(500).render('pages/error');
    });
    

}

//=========================== Handle Delete=================

function handleDelete(req,res){
    let id = req.params.id;
    let deleteQueri = 'DELETE FROM books WHERE id =$1';
    let safeValue= [id];

    client.query(deleteQueri,safeValue).then(()=>{
        res.redirect('/');
    }).catch(error=>{
        res.status(500).render('pages/error');
    });
}


//========================Handle Update =====================

function handleUpdate(req, res){
    let id = req.params.id;
    let values= req.body;

    let updatedQuery= 'UPDATE books SET author= $1, title= $2, isbn= $3, image_url=$4, description=$5 WHERE id= $6';

    let safeValue= [values.author,values.title,values.isbn,values.image,values.description,id];

    client.query(updatedQuery,safeValue).then(()=>{
        res.redirect('/');
    }).catch(error=>{
        res.status(500).render('pages/error');
    });
}

//====================Book Constructor=======================

function Book(imgURL, title, isbn, authors, description) {
    this.thumbnail = imgURL || 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = title || 'there is no title';
    this.type = `ISBN: ${isbn}` || 'ISBN :not found';
    this.authors = authors || 'No authors are founded';
    this.description = description || 'No description was found';
}

//======================Handle Errors=======================

function handleError(req, res) {
    res.render('pages/error');
}



//============Connect to DB & Listener=======================


client.connect().then(() => {
    app.listen(PORT, () => {
      console.log('listening on port ', PORT);
    });
  }).catch((error) => {
    res.status(500).render('pages/error');
  });
