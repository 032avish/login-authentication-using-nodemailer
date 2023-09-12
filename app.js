const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const nodemailer= require("nodemailer");

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());

let transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user: "avishmittal2000@gmail.com",
        pass:"klvhwvmmyxbqrepe",
    },
    tls: {
        rejectUnauthorized: false
    }
});
transporter.verify((error,success)=>{
    if(error){
        console.log(error);
    } else {
        console.log("Ready for Message");
        console.log(success);
    }
})


var conn = mysql.createConnection({
    host: "localhost",
    user: "avish",
    password: "kE1S7pfNLrlSSpLG",
    database: "railyatri",
    port: 3307
});

conn.connect((err)=>{
    if(err) {
        console.log("problem in connectivity!!");
        throw err;
    }
    console.log("Connected Successfully");
});

app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/login.html");
});

app.get('/register',(req,res)=>{
    res.sendFile(__dirname+"/register.html");
});
app.get("/resendOtp",(req,res)=>{
   
    res.sendFile(__dirname+"/resendOtpVerificationcode.html");
  })

app.get('/book',(req,res)=>{
    res.sendFile(__dirname+"/book.html");
});

app.post('/submit',(req,res)=>{
    const name = req.body.Name;
    const dob = req.body.dob;
    const Email = req.body.email;
    const pass = req.body.password;
    const repass = req.body.repassword;
    if(repass===pass){
        const sql = 'Select Email from users where Email='+mysql.escape(Email);
        conn.query(sql,(err,result)=>{
              if(err) 
              {
                console.log("Error in checking record!!");
                throw err;
              }
              else if(result.length>0)
              {
                console.log("User Already Exists.");
                res.sendFile(__dirname+"/login.html");
              } 
              else
              {
                const qr = 'Insert into users(Name,DOB,Email,Password,Verified) values(?,?,?,?,?);';  

                 
                conn.query(qr,[name,dob,Email,pass,"false"],(err,response)=>{
                    if(err) 
                    {
                        console.log("Error in inserting!!");
                        throw err;
                    }
                    else
                    {  
                        sendOtpVerificationEmail({Email},res);
                        console.log("user registered succesfully!!");
                        res.sendFile(__dirname+"/verifyotp.html");
                    } 
                }) 
               
              }
        })
    }
    else
    {
        console.log("Password do not match!!");
        res.sendFile(__dirname+"/login.html");
    }
});
const sendOtpVerificationEmail= async({Email},res)=>{

    try {
     const otp= `${ Math.floor ( 1000 + Math.random() * 9000) }`;
     const mailoption ={
        from : "avishmittal2000@gmail.com",
        to :Email,
        subject : "Verify Your Email",
        html : `<p> Enter ${otp} in the app to verify your email address and complete the signUp process <br> The code expires in 10 minutes </p>`
     };
     const qr2 = 'Insert into otp(Useremail,otp,createdat,expireat) values(?,?,?,?)';
     var currentTime = new Date();
     var tenMinutesLater = new Date(currentTime.getTime() + 10 * 60000);
     conn.query(qr2,[Email,otp,currentTime,tenMinutesLater],(err,result)=>{
       if(err) 
       {
         throw err;
       }
    })
     await transporter.sendMail(mailoption);
    } 
    catch (err){
        console.log(err);
        let  message = err.message;
        console.log(message);
    }
}
app.post("/verifyOtp",async (req,res)=>{
    try {
        console.log(req.body);
 
        const Email = req.body.Email;
      
        const otp = req.body.otp;

        console.log(Email);
        const rec = 'Select otp from otp where Useremail='+mysql.escape(Email);
        conn.query(rec,(err,record)=>{
            console.log(record);
            if( record.length <= 0){
                res.sendFile(__dirname+"/verifyotp.html");
            }
            else {   
                // var currentTime = new Date();
                console.log(record[0].otp)
                // if(record[0].expireat<currentTime.getTime())
                // {
                    let validotp = otp===record[0].otp ? true: false;
                    console.log(validotp);
                       if(!validotp){
                          res.sendFile(__dirname+"/verifyotp.html");
                        
                       } 
                       else{
                         const update= 'update users set Verified=true where Email='+mysql.escape(Email);
                         const deleteOTP = 'delete from otp where Useremail='+mysql.escape(Email);
                         conn.query(update,(err,res)=>{
                          if(err)
                          console.log(err);
                          else
                          console.log("updated");
                      })
                  conn.query(deleteOTP,(err,res)=>{
                      if(err)
                      console.log(err);
                      else
                      console.log("deleted");
                   })
                   res.sendFile(__dirname+"/login.html");
                }
                // }
            //    else{
            //     console.log("Otp Expired");
            //     const deleteOTP = 'delete from otp where Useremail='+mysql.escape(Email);
            //     conn.query(deleteOTP,(err,res)=>{
            //         if(err)
            //         console.log(err);
            //         else
            //         console.log("deleted");
            //      })
                    // const deleteUser = 'delete from users where Useremail='+mysql.escape(Email);
                    // conn.query(deleteUser,(err,res)=>{
                    //     if(err)
                    //     console.log(err);
                    //     else
                    //     console.log("User deleted");
                    //  })
            //      res.sendFile(__dirname+"/register.html");
            //    }

                    
            }  
        })
                
        
        } 
        catch (error) {
        console.log(error);

        res.sendFile(__dirname+"/verifyotp.html");

    }
})

app.post("/resendOtp", async (req,res)=>{
    try {
        let {Email}  = req.body;

        if(!Email){
           throw Error("Empty User details are not allowed");

        } else {
        //    await UserOtp.deleteMany({email});
           const query = "delete from otp where Useremail = "+mysql.escape(Email);
           conn.query(query,(err,result)=>{
            if(err) throw err;
            else console.log("Deleted succesfully");
           })
           sendOtpVerificationEmail({Email},res);
           res.sendFile(__dirname+"/verifyotp.html");
        }
    } catch (error) {
        console.log(error);
        res.sendFile(__dirname+"/verifyotp.html");
    }

})


app.post('/login',(req,res)=>{
    const Email = req.body.email;
    const password = req.body.password;
    const sql = 'Select email,password from users where Email = '+mysql.escape(Email);
    conn.query(sql,(err,response)=>{
         if(err)
         {
            console.log("Error in fetching the data");
            throw err;
         }
         else if(response.length>0&&response[0].password===password&&response[0].Verified===1)
         {
            res.sendFile(__dirname+"/book.html");
         }
         else
         {
            console.log("Invalid login credentials or user not verified");
            res.sendFile(__dirname+"/book.html");
         }
    });
})


app.listen(process.env.PORT||3000,()=>{
    console.log("Server is Listening on port : "+3000);
});