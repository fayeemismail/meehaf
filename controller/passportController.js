const userSchema = require('../models/userModel');


const successGoogleLogin = async (req, res) => {
    try {
        if(!req.user) {
            // ---- If error ----
            res.redirect('/failure')
        } else {
            // ---- Search user on userSchema ----
            let user = await userSchema.findOne({ email: req.user.email })
            if(!user){
                // ---- If not insert user details ----
                userSchema.insertMany({ email: req.user.email, name: req.user.displayName, is_blocked: false })
                console.log('hello')
            }

            // ---- Find user and store to session ----

            let existingUser = await userSchema.findOne({ email: req.user.email });


            if(existingUser){
                req.session.user_id = existingUser.id;
                res.redirect('/')
            }else{   

                console.log('create user');
                const data = await userSchema({
                    email: req.user.email,
                    name: req.user.displayName
                })
                req.session.user_id = data.id;

            await data.save()


            res.redirect('/')
            }
            
        }
    } catch (error) {
        console.log(error.message)
    }
}

const failureGoogleLogin = (req, res) => {
    try {
        res.redirect('/login')
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    successGoogleLogin,
    failureGoogleLogin
}