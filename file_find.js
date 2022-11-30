const fs = require('fs');
const path = require('path')

const find = {
    req_img : (result)=>{
        return imgs = fs.readFile(path.join(__dirname,result),(err,data)=>{ if (err) console.log(err); });
    },

}


module.exports = { find }