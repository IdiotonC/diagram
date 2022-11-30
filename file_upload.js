const multer = require('multer');
const path = require('path');

let date = new Date();
let time = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`; 

const upload = multer({
        storage:  multer.diskStorage({
        destination : (req,file,cb)  => {
            cb(null, './public/upload/')
        },
    
        filename : (req,file,cb) => {
            const ext = path.extname(file.originalname)
            const name = path.basename(file.originalname,ext) + time + ext;
            cb(null, name);
        }
    
    })

})


module.exports = { upload };