'use strict';
const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');
const app = express();



require('dotenv').config();
app.use(cors());
const PORT = process.env.PORT;



app.set('view engine','ejs');
// app.get('/hello',(req,res)=>{
//   res.render('pages/index');
// })

app.get('/searches/new',handleNew);



function handleNew(req,res){
    res.render('pages/searches/new');
}



app.listen(PORT,()=>{
    console.log('server is running on port', PORT);
})