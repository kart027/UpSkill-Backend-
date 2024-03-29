const Courses = require("../models/CourseSchema")
const User = require("../models/Usermodels")
const { CatchAsyncError } =require("../middlewares/CatchAsyncError");
const  ErrorHandler  = require("../utils/Errorhandler");
const getDatauri = require("../utils/DataUri")
const cloudinary = require("cloudinary");
const { on } = require("nodemailer/lib/xoauth2");
const Stat = require("../models/Stats")



exports.getALLcourses = async (req,res)=>{
    try {
        const courses = await Courses.find().select("-password")
        res.status(200).json({
            sucess:true,
            courses
        })
    } catch (error) {
        res.status(500).json({
            message:error.message
        })
    }
}

exports.createCourse = CatchAsyncError(async(req,res ,next)=>{
    const { title,description,category,createdBy} = req.body;
    console.log(title,description,category,createdBy)

    if (!title || !description || !category || !createdBy){
        return next(new ErrorHandler("Please add all fields",400));
    }


        const file = req.file;

        const fileuri = getDatauri(file)

        const mycloud = await cloudinary.v2.uploader.upload(fileuri.content)
    await Courses.create({
        title,
        description,
        category,
        createdBy,
      poster:{
        public_id: mycloud.public_id,
        url:mycloud.url
      }
       
    })

    res.status(201).json({
        sucess:true,
        message:"course created succesfully"
    })

})


exports.addtoPlaylist = CatchAsyncError(async(req,res,next)=>{
    const user = await User.findById(req.user._id);
    
    const course = await Courses.findById(req.body.id);
    
    if(!course){
        return next(new ErrorHandler("Incorrect id Passed",404))
    }

    const itemExist = user.Playlists.find((item)=>{
        if(item.course.toString()=== course._id.toString())
        return true;
    })
    
        if(itemExist){
            return next(new ErrorHandler("Already in playlist"))
        }

  user.Playlists.push({
    course:course._id,
    poster:course.poster.url,
  });
    
    await user.save();
    
    
    res.status(200).json({
        sucess:true,
        message:"Added to playlist"
    })
    
    })
    
    
    
    exports.removefromPlayist = CatchAsyncError(async(req,res,next)=>{
        const user = await User.findById(req.user._id);
    
        const course = await Courses.findById(req.query.id);
        
        if(!course){
            return next(new ErrorHandler("Incorrect id Passed",404))
        }
    
        const newplaylist = user.Playlists.filter((item)=>{
            if(item.course.toString()!=course._id.toString()){
                return item;
            }
        })
        user.Playlists =newplaylist;
   
        
        await user.save();
        
        
        res.status(200).json({
            sucess:true,
            message:"Remove from playlist"
        })
        
        })


        
exports.getcourselecture = CatchAsyncError(async (req,res,next)=>{
    
        const courses = await Courses.findById(req.params.id);
        if(!courses){
            return next(new ErrorHandler("Coursere not found",404))
        }

        courses.views+=1;
        
       
        res.status(200).json({
            sucess:true,
            lectures:courses.lectures,
        })
    
    
})
// Maximum size can be only 100 mb
exports.addcourselecture = CatchAsyncError(async (req,res,next)=>{
    
    const {title, description} = req.body;

    
    const courses = await Courses.findById(req.params.id);
    if(!courses){
        return next(new ErrorHandler("Coursere not found",404))
    }

        const file = req.file;

        const fileuri = getDatauri(file)

        const mycloud = await cloudinary.v2.uploader.upload(fileuri.content,{
            resource_type:"video",
        });

        courses.lectures.push({
            title:title,
            description:description,
            public_id:mycloud.public_id,
            url:mycloud.secure_url,
        });

    courses.numofVideos = courses.lectures.length;
    
    await courses.save();
   
    res.status(200).json({
        sucess:true,
        lectures:courses.lectures,
    })


})

exports.DeleteCourse = CatchAsyncError(async(req,res,next)=>{
    const courses = await Courses.findById(req.params.id);
    if(!courses){
        return next(new ErrorHandler("Coursere not found",404))
    }

    await cloudinary.v2.uploader.destroy(courses.poster.public_id);
    
    for (let index = 0; index < courses.lectures.length; index++) {
       const singlelecture = courses.lectures[index];
       await cloudinary.v2.uploader.destroy(singlelecture.public_id,{
        resource_type:"video",
       });

        
    }

    await courses.remove();
   
    res.status(200).json({
        sucess:true,
        message:"Course deleted sucefully",
    })

});

exports.DeleteLecture = CatchAsyncError(async(req,res,next)=>{
    const{ courseId,lecturesId} = req.query;
    const course = await Courses.findById(courseId);
    if(!course){
        return next(new ErrorHandler("Coursere not found",404))
    }
    const Lecture = course.lectures.filter(item=>{
        if(item._id.toString() == lecturesId.toString())
        return item;
    })
    await cloudinary.v2.uploader.destroy(Lecture.public_id,{
        resource_type:"video",
       });
       course.lectures = course.lectures.filter(item=>{
        if(item._id.toString() != lecturesId.toString())
        return item;
    }) 

    course.numofVideos = course.lectures.length;
    res.status(200).json({
        sucess:true,
        message:"Lecture deleted sucefully",
    })
})

Courses.watch().on("change",async()=>{
    const stats = await stat.find({}).sort({ createdAt: "desc" }).limit(1);

    const courses = await Courses.find({});
     let totalview = 0;

     for(let i =0;i<courses.length;i++){
        totalview += courses[i].views
     }

     stats[0].views = totalview;
     stats[0].createdAt = new Date(Date.now());

     await stats[0].save();

})




    
    