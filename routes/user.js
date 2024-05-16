import { Router } from "express";
const user=Router();
import db from "../connection.js";
db.connect();
import bcrypt from "bcrypt";
const saltRounds=10;
import jwt from "../services/auth.js";
import jwtTokenAuthorization from "../middleware/auth.js";
// user.use(jwtTokenAuthorization);

user.post("/register" , async (req,res)=>{
     try{
     const result=await db.query("select * from users where aadhar_number = $1" , [req.body.aadhar_number]);

     if(result.rows.length != 0){
        return res.status(400).json({error : "aadhar number already exist"});
     };
     
     bcrypt.hash(req.body.password , saltRounds , async function(err,hash){
        if(err){
            return res.status(500).json({error : "internal server error"});
        } 
        try{
           const result = await db.query("insert into users (name,email,phone,age,address,aadhar_number,password) values ($1,$2,$3,$4,$5,$6,$7) RETURNING *",[req.body.name,req.body.email,req.body.phone,req.body.age,req.body.address,req.body.aadhar_number,hash]);
           const payload={
              id : result.rows[0].id, 
           }
           const token=jwt.generateToken(payload);
           res.status(200).json({message : "user successfully registered" , user : result.rows[0] , token : token});
        }
        catch(err){
            if(err.code === "23502"){
               return res.status(400).json({error : "incomplete information provided regarding the user"});
            }
            res.status(500).json({error : "internal server error"});
        }
     });
    }
    catch(err){
        res.status(500).json({error:"internal server error"});
    }
    
});


user.post("/login" , async (req,res)=>{

   const{aadhar_number,password}=req.body;
    if(!aadhar_number || !password){
        return res.status(400).json({error : "aadhar card number and password are required"});
    }

   try{ 
       const response=await db.query("select * from users where aadhar_number = $1" , [aadhar_number]);
       if(response.rows.length == 0){
         return res.status(401).json({error : "aadhar number not exist"});
       }
       bcrypt.compare(password,response.rows[0].password,function(err,result){
           if(err){
             return res.status(500).json({error : "internal server error"});
           };
           if(!result){
              return res.status(401).json({error : "password incorrect"});
           };
           const payload={
             id : response.rows[0].id
           };
           const token=jwt.generateToken(payload);
           res.status(202).json({message : "successfully logedin" , token : token});
       });
   }
   catch(error){
    console.log(error);
     res.status(500).json({error : "internal server error"});
   }
});

user.get("/profile", jwtTokenAuthorization ,async (req,res)=>{
      const id=req.user.id;
      try{
      const result= await db.query("select * from users where id = $1" , [id]);
      res.status(200).json(result.rows[0]);
      }
      catch(error){
        console.log(error);
        res.status(500).json({error : "internal server error"});
      }
});

user.put("/profile/password", jwtTokenAuthorization , async (req,res)=>{
   const id=req.user.id;
   const {currentPassword , newPassword}=req.body;
   if(!currentPassword || !newPassword){
      return res.status(400).json({error : "both current and new password are required"});
   }
   if(currentPassword === newPassword){
      return  res.status(400).json({error : "current and new password are same"});
   }
   try{
   
      const response=await db.query("select * from users where id = $1" , [id]);
   
   if(response.rows.length == 0){
      return res.status(400).json({error : "user doesnt exist"});
   }

   bcrypt.compare(currentPassword , response.rows[0].password ,  function(err,result){
       if(err){
        return res.status(500).json({error : "internal server error"});
       } 
       if(!result){
         return res.status(200).json({error : "inccorect current password"});
       }  
       if(result){
          bcrypt.hash(newPassword , saltRounds , async function(err,hash){
             if(err){
               return res.status(500).json({error : "internal server error"});
             }
             try{
               await db.query("update users set password = $1 where id = $2" , [hash , id]);
               return res.status(200).json({message : "password updated"});
             }
             catch(err){
               console.log(err);
               return res.status(500).json({error : "internal server error"});
             }
          })
       }
   })
   }
   catch(err){
      res.status(500).json({error : "internal server error"});
   }
});


export default user;