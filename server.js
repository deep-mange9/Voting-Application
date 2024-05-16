import express from "express";
const app=express();
const port=5000;
import userRouter from "./routes/user.js";
import candidateRouter from "./routes/candidate.js";
import bodyParser from "body-parser";
app.use(bodyParser.urlencoded({extended : true}));



app.use("/user" , userRouter);
app.use("/candidate" , candidateRouter);







app.listen(port,()=>{
    console.log(`the server is running on port ${port}`);
});