const is_login = async (req,res,next) => {

    try {

    if(req.session.user_id){
        next()
    }else{
        res.redirect('/login')
    }

    } catch (error) {
        console.log(error)
    }

}


const is_logout = async (req,res,next) => {

    try {
        if(!req.session.user_id){
            next()
        }else{
            res.redirect('/')
        }

    } catch (error) {
        console.log(error)
    }

}


module.exports = {
    is_login,
    is_logout
}