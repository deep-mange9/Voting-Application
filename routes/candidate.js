import { Router } from "express";
const candidate=Router();
import jwtTokenAuthorization from "../middleware/auth.js";
import db from "../connection.js";

async function admin_role_check(id){ 
    try{
        const result = await db.query("select role from users where id = $1" , [id]);
        if(result.rows[0].role === "admin"){
            return true;
        }
        else{
            return false;
        }
    }
    catch(err){
        console.log(err);
        return false;
    }  
};


candidate.get("/" , async (req,res)=>{
    try{
     const candidates = await db.query("select name,party from candidate");
     res.status(200).json(candidates.rows); 
    }
    catch(error){
        console.log(error);
        res.status(500).json({error : "internal server error"});
    }
});



candidate.post("/" , jwtTokenAuthorization , async (req,res)=>{
    const id=req.user.id;
    if(!(await admin_role_check(id))){
        return res.status(403).json({error : "voter is not allowed to add candidate"});
    }
    else{
        const {name , party , age}=req.body;
        if(!name || !party || !age){
           return res.status(400).json({error : "name or party or age of candidate is required"});
        }
        try{ 
            const result=await db.query("insert into candidate (name , party , age) values ($1,$2,$3) returning *" , [name,party,age]);
            res.status(202).json({message : "candidate added successfully" , result : result.rows[0]});
        }
        catch(err){
            console.log(err);
            return res.status(500).json({error : "internal server error"});
        }
    }
});

candidate.delete("/:candidateID", jwtTokenAuthorization ,async (req,res)=>{
     const candidateID=req.params.candidateID;
     const userID=req.user.id;
     
     try{
     if(!(await admin_role_check(userID))){
        return res.status(403).json({error : "voter is not allowed to delete candidate"});
     }
     else{
       const result = await db.query("delete from candidate where id = $1 returning *" , [candidateID]);
       if(result.rows.length == 0){
         return res.status(404).json({error : "candidate not found"});
       }
       res.status(200).json({message : "user succeessfully deleted" , result : result.rows[0]});  
     }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({error : "internal server error"});  
    }
});

candidate.put("/:candidateID",jwtTokenAuthorization , async (req,res)=>{
    const candidateID=req.params.candidateID;
    const userID=req.user.id;

     try{
     if(!(await admin_role_check(userID))){
        return res.status(403).json({error : "voter is not allowed to update candidate"});
     }
     else{
         const {name,party,age}=req.body;
         const result=await db.query("update candidate set name = $1,party=$2,age=$3 where id=$4 returning *" , [name,party,age,candidateID]);
         if(result.rows.length == 0){
            return res.status(404).json({error : "candidate not found"}); 
         } 
         res.status(200).json({message : "user succeessfully updated" , result : result.rows[0]});
     }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({error : "internal server error"});  
    }
});

// for voting


candidate.get("/vote/:candidateID", jwtTokenAuthorization , async(req,res)=>{
    const candidateID=req.params.candidateID;
    const userID=req.user.id;

    try{  
        const user = await db.query("select * from users where id = $1" , [userID]);

        if(user.rows.length == 0){
            return res.status(404).json({error : "user not exist"});
        }

        if(user.rows[0].role == "admin"){
            return res.status(403).json({error : "admin is not allowed to vote"});
        }

        if(user.rows[0].isvoted === true){
            return res.status(400).json({error : "you have already voted"});
        }

        const result = await db.query("update candidate set votecount= votecount + 1 where id = $1 returning *" , [candidateID]);
         if(result.rows.length == 0){
            return res.status(404).json({error : "candidate not found"});
         }

         await db.query("insert into votes (candidate_id,user_id) values($1,$2)" , [candidateID,userID]);
         await db.query("update users set isvoted = 'true' where id = $1" , [userID]);
         res.status(200).json({message : "voted successfully"});
       }
    
    catch(error){
        console.log(error);
        return res.status(500).json({error : "internal server error"}); 
    }
});



candidate.get("/count" , async (req,res)=>{
     try{
        const candidate=await db.query("select name,votecount from candidate order by votecount desc");
        res.status(200).json({message : candidate.rows});
     }
     catch(error){
        console.log(error);
        return res.status(500).json({error : "internal server error"}); 
    }

});














export default candidate;