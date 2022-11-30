const express = require('express')
const path = require('path')
const http = require('http')
const { dirname } = require('path') 
const app = express()
const session = require('express-session')
const ejs = require('ejs')

let date = new Date();
let time = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`; 


const mysqlConObj = require("./dbconfig");
const conn = mysqlConObj.init();
mysqlConObj.open(conn);

app.set('port',8080)

const server = http.createServer(app);

server.listen(app.get('port'),(err)=>{
    if(err) return console.log(err);
    console.log('8080 live on')
})

app.use(session({
    key: "diagram_key", 
    secret:"diagram_secret",
    resave: false,
    saveUninitialized: true,
    })
)

app.set('view engine','ejs')
app.set('views','./views')

app.use(express.static('public'));

app.use(express.urlencoded());

app.get('/',(req,res)=>{ 
    res.sendFile(path.join(__dirname,'index.html'))
})

app.post('/',(req,res)=>{
  if(req.session.isLogined != true){ res.redirect('/'); console.log("not logined")}
    else{
        req.session.destroy((err)=>{  
            res.redirect('/');
            console.log(`currently user logout`);
        });
    } 

 })


app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'login.html'))    
})

app.post('/login',(req,res)=>{
    const reqid = req.body.uid;
    const reqpwd = req.body.upwd;
    if(reqid&&reqpwd){
        conn.query('SELECT * FROM info where userID=?',[reqid],(err,result)=>{
            if(result.length){ // 입력값이 db 에 있는지 없는지 검사 
                if(reqid == result[0].userID && reqpwd == result[0].userPassword) {
                    console.log(result[0].userID + ' login correct')
                    req.session.uid = result[0].userID;
                    req.session.upwd = result[0].userPassword;
                    req.session.isLogined = true;

                    req.session.save(function(){
                        res.redirect('/');
                    })
                }
                else res.redirect('/login')    
            }
            else res.redirect('/login')
        })
    }
    else res.redirect("/login");

})



app.get('/register',(req,res)=>{
    res.sendFile(path.join(__dirname,'register.html')) ;
})


app.post('/register',(req,res)=>{
    let uid = req.body.uid;
    let uname = req.body.uname;
    let upassword = req.body.upwd;
    let ubirth = req.body.ubirth;

    let sql = 'INSERT INTO info (userID,userPassword,userName,userBirth) VALUES (?,?,?,?)';
    let check_sql = 'SELECT * from info where userID = ?';
//    let register_sql = `create table ? (uid char(20), img char(100))`; // 유저 테이블 생성



    if(uid.length == 0 || uname.length == 0 || upassword.length == 0 || ubirth.length == 0){
         res.send("<script>alert('포멧에 맞지 않습니다.'); location.href = '/register' </script>")
     }
    else{
     conn.query(check_sql,[uid],function(err,result,field){
        if(result.length != 0){
            res.send("<script>alert('이미 존재하는 ID 입니다'); location.href = '/register';</script>")
        }   
        else {
            conn.query(sql, [uid,upassword, uname,ubirth],function(err,result,field){
                
                res.send("<script>alert('회원가입 성공입니다.'); location.href = '/register'</script>")



                if(err){
                    console.log(err)
                    res.status(500).send('500:INTERNAL SERVER ERROR')
                }
                    console.log(result)
            }) 
        }

     })
      
     }
   
});

// 파일 업도르 부분


const { upload } = require('./file_upload')  // 웹에 파일 올리기 
const fs = require('fs')


app.get('/drive',(req,res)=>{
    res.sendFile(path.join(__dirname,'drive.html'))
})

app.post('/drive', upload.single('upload_file'),(req,res)=>{  // 잘되던 코드가 이상함
    const uid = req.session.uid; // 이미지 소유자
    const img = `/upload/${req.file.filename}` // 이미지 경로 
    const comments = req.body.comments
    const sql = "INSERT INTO img_board(userID,date,img,comments) VALUES (?,?,?,?)"

    if (req.file == null) {
        console.log("No file received");
        return res.send({
            success : false
        });     
    } 
        
    else {
        if(uid != null){ // 로그인 했을 시에만 db 에 저장
            conn.query(sql,[uid,time,img,comments],(err,data)=>{
                if(err) console.log(err);
                console.log('file received');
                res.send("<script>alert('file received'); location.href = '/drive'</script>")
            })
        }
        else res.send("<script>alert('not logined'); location.href = '/drive'</script>") // 로그인 안했다고 알림
    }   
})

app.get('/diary',(req,res)=>{
    res.sendFile(path.join(__dirname,'diary.html'))
})

app.post('/diary',(req,res)=>{
    const uid = req.session.uid;
    const date = req.body.date_req;
    const sql = "SELECT * FROM img_board WHERE userID=? and date=?";

    console.log(uid)
    console.log(date)
    if (uid == null) res.send("<script>alert('not logined'); location.href = '/diary'</script>");
    else {
        conn.query(sql,[uid,date],(err,result)=>{
            res.render("diary.ejs" , {result : result})
        })
    }
});

app.get('/delete',(req,res)=>{
    res.sendFile(path.join(__dirname,'delete.html'))
})

app.post('/delete',(req,res)=>{
    const uid = req.session.uid;
    const date = req.body.date_req;
    const sql = "select img from img_board where userID=? and date=?"; 

    if(uid == null)  res.send("<script>alert('not logined'); location.href ='/delete'</script>");
    else {
            conn.query(sql,[uid,date],(err,result)=>{
                console.log(err)
                console.log(result)
                console.log(result.length)
                if(result.length == 0) res.send("<script>alert('이미 삭제된 추억입니다.'); location.href = '/delete'</script>")
                else {
                    for(let i = 0; i<result.length; i++){
                        if(fs.existsSync(path.join(__dirname) + '/public' + result[i].img)){
                            fs.unlinkSync(path.join(__dirname) + '/public' + result[i].img);
                            const del_sql = "delete from img_board where userID=? and date=?";
                            conn.query(del_sql,[uid,date]);
                        }
                    }
                    res.send("<script>alert('file succesfully deleted'); location.href='/delete'</script>"); 
                }           
            })

       
    }

})





