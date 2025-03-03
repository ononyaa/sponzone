//configure express including express modules
const express = require("express");
// including path modules and
//to use path module-specify the path of static file
const path=require('path');
const bodyParser=require('body-parser');

//library to use hashing algo on passwords
const bcrypt=require('bcryptjs');

const mongoose=require('mongoose');
//importing User collection from model folder
const User=require('./model/user')
//importing JWT for login authentication
const jwt=require('jsonwebtoken')

//SECRET KEY FOR JWT
//it is important and needed to be hidden from client-side
const JWT_SECRET='ehfggfGWEGVBB#@&WBFBEV324IU298NBV34FKJB$@'
//if recreated all previous doc with this token is invalid



//".connect"-method for connecting
//mongodb://localhost:27017/NameOfDatabase
mongoose.connect('mongodb://localhost:27017/SponZone-db',{
    //useNewUrlParser & useUnifiedTopology so that deprecation warning dosent come and you dont see error signs
    useNewUrlParser:true,
    useUnifiedTopology:true
   
})
//app got all methods and properties of express
const app=express();


//app.use is ex-method use to add custom middleware functions
//ex.static is used to provide file path thats required by client
//path.join adds sponsor to the filepath to check for index.html
app.use('/',express.static(path.join(__dirname,'sponsor')))

//by default ex dont parse json send in register.js request
//for that body-parser-middleware decode json body
app.use(bodyParser.json())


//async because there's multiple db calls

app.post('/api/register',async (req,res)=>{
    
    console.log(req.body)//req.body takes input from "name" tag of the form
    const {username,password:pt,email,phone}=req.body;//destructuring req.body(obj)
    //pt-variable name for password

    if (!username || typeof username!=='string') {
        // Return an error response if the username is not provided
        return res.status(400).json({ error: 'Invalid or no Username' });
      }
    

    //hash(string,numberofsalting)
    const password=await bcrypt.hash(pt,10);
    //so that password stores hashcode


    try {
        //creating a record
        const response=await User.create({
            username,
            email,
            phone,
            password
        })
        console.log('User created Succesfully',response)
    } catch (error) {
        if(error.code===11000)//code for duplicate value
        {
            console.log('Username Already in use');
            return res.json({status:'error',error:'Username Already in use'})}
           
    }
    //res.json automatically set headers on server
    //you cant use res.json,.end,.send while sending coz
    //it dosent allow to modify headers anymore
    res.json({status:'ok'})
});


app.post('/api/login',async (req,res)=>{
    const{username,password}=req.body;//destucturing

    //User is the mongoose collection we created
    //findOne checks the collection and returns first document matching
    //lean is used to return plain jsobject instead of Mongo doc
    //lean also improves performnce,skips some features of Mongo
    const user=await User.findOne({username});

    if(!user)//if username dosent exist
    {
        return res.json({status:'error',error:"Invalid username/password"})
    }
//as bcrypt never returns same encode even with same value
//so we need to use the compare func to match input password
//with the created password(user.password)
    
    if(await bcrypt.compare(password,user.password)){  
        
        //jwt.sign provides a encoded form of all the data required
        const token=jwt.sign({
            id:user.id,
            username:user.username,
            email:user.email,
            phone:user.phone    
        },
        JWT_SECRET//the private key for JWT
        )

        return res.json({status:'ok',data:token})

    }
    res.json({status:'error',error:'incorrect credentials'})


})

app.post('/api/forgot-password',async (req,res)=>{

    const {username,newpassword}=req.body;//destructuring token 
    console.log(username,newpassword)

      //User is the mongoose collection we created
    //findOne checks the collection and returns first document matching
    //lean is used to return plain jsobject instead of Mongo doc
    //lean also improves performnce,skips some features of Mongo
    const user=await User.findOne({username});

    if(!user)//if username dosent exist
    {
        return res.json({status:'error',error:"Invalid username/password"})
    }
   
    try{
     //verify method gives   the middle part of JWT
    // const user=jwt.verify(token,JWT_SECRET);

    const _id=user.id
    console.log(_id)

    const password=await bcrypt.hash(newpassword,10)

    await User.updateOne({_id},{
        $set:{password}
    })
    console.log("JWT decoded",user)
    res.json({status:'ok'})
    }
    catch(error){
        console.log(error)
        res.json({status:'error',error:'something'})
    }


})


//for hosting the project globally(env.PORT)|| OR LOCALLY(3000)
//env-environmental this gives a random port number to host it globally
const port=process.env.PORT||9999;

app.listen(port,()=>{
    console.log(`server is running at port no ${port}`)
})