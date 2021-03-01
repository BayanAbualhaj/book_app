'use strict';
const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');

const app = express();



require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/public',express.static('./public'));
const PORT = process.env.PORT;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });



app.set('view engine','ejs');
app.get('/',handleHome);
app.get('/searches/new',handleNew);
app.post('/searches',handleSearches);
app.get('*',handleError);

const googleAPI='https://www.googleapis.com/books/v1/volumes';

function handleHome(req,res){
    res.render('pages/index');
}



function handleNew(req,res){
    res.render('pages/searches/new');    
}

function handleSearches(req,res){
    let searchQuery=req.body.searchQuery;
    let searchWith=req.body.searchBy;
    let que= "+in"+searchWith+":"+searchQuery;

    let query={
        q: que
    };
   
    superAgent.get(googleAPI).query(query).then(data=>{

        let booksArray=[];
        data.body.items.map((value)=>{

            let imgURL= value.volumeInfo.imageLinks.thumbnail.replace('http://','https://');
            let title= value.volumeInfo.title;
            let authors= value.volumeInfo.authors;
            let description = value.volumeInfo.description;

            let booksObject= new Book (imgURL,title,authors,description);

            booksArray.push(booksObject);
        });
        console.log(booksArray);
        res.render('pages/searches/show',{arrayOfItems:booksArray});
        
    }).catch(error=>{
        res.status(500).send('there is an error    ' ,error);
    });
}

function Book(imgURL,title,authors,description){
    this.thumbnail=imgURL || 'https://i.imgur.com/J5LVHEL.jpg';
    this.title=title || 'there is no title';
    this.authors= authors || 'No authors are founded';
    this.description= description || 'No description was found';
}

function handleError(req,res){
    res.render('pages/error');
}


app.listen(PORT,()=>{
    console.log('server is running on port', PORT);
});