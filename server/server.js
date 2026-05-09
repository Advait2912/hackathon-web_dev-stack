const express=require("express");
const cors=require("cors");
const sqlite3=require("sqlite3").verbose();
const app=express();

app.use(cors());
app.use(express.json());


const db= new sqlite3.Database("tasks.db");

db.run(`
CREATE TABLE IF NOT EXISTS tasks(
id integer primary key autoincrement,
title text
)
`);

app.post("/tasks",(req,res)=>{
	const {title}=req.body;
	if(!title){
		return res.status(400).json({error:"NO title provided"});
	}
	db.run(
	"INSERT INTO TASKS (title) VALUES (?)",
	[title],
	function(err){
		if(err){
			return res.status(500).json({error:err.message});
		}
		res.json({id:this.lastID,title});
	}
	);
});


app.get("/tasks",(req,res)=>{
	db.all("SELECT * FROM tasks",[],(err,rows)=>{
		if (err){
			return res.status(500).json({error:err.message});
		}
		res.json(rows);
	});
});
app.get("/",(req,res)=>{
	res.json({message:"server running",status:"db up"});
});

app.listen(3000,()=>{
	console.log("app running on port 3000");
});

