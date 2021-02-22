
const express= require('express');
const util=require ('util'); // no se necesita instalarla
const app=express();

require('dotenv').config();

app.use(express.static('contact'));
app.use(express.urlencoded({ extended: true }));

/********************CONEXIÓN A BASE DE DATOS*************************/
/*   Se utilizan variables de entorno para ocultar datos sensibles.  */
/*********************************************************************/
var mysql=require('mysql');
var conexion= mysql.createConnection({
    host: process.env.APP_HOST,
    user:process.env.APP_USER,
    password:process.env.APP_KEY,
    database:process.env.APP_DB
});

conexion.connect((error)=>{
    
    if(error){
        
        console.log("Error en la conexion a la Base de datos");
        return;

    }

});
    
const qy= util.promisify(conexion.query).bind(conexion); //permitira el uso de async-await en la conexion mysql

/*********************************************************************/

app.get('/mensajes',async (req,res)=>{
    try{
        let registros=await qy ('SELECT * FROM mensaje');
        if (registros.length==0){
            throw new Error ('No se han encontrado mensajes.');
            return;
        }
        res.status(200).send(registros);
    }
    catch(error){
        if(error.message!= 'No se han encontrado mensajes.'){
            res.status(413).send({"Mensaje": "error inesperado"});
            return;    
        }
        
        res.status(413).send({"Mensaje": error.message});
    }
});

app.get('/usuarios',async (req,res)=>{
    try{
        let registros=await qy ('SELECT * FROM usuario');
        if (registros.length==0){
             res.status(413).send({"Mensaje":'No se han encontrado usuarios.'});
             return;
        }
        res.status(200).send(registros);
    }
    catch(error){
        
        res.status(413).send('error inesperado');
        
    }
});

app.get('/mensajes/:id',async (req,res)=>{
    try{
        let registros=await qy ('SELECT * FROM mensaje WHERE id=?',req.params.id);
        if (registros.length==0) {
     
            throw new Error ('No se ha encontrado el mensaje solicitado.');
 
        }
        res.status(200).send(registros);
    }
    catch(error){
        if(error.message!= 'No se ha encontrado el mensaje solicitado.'){
            res.status(413).send({"Mensaje": "error inesperado"});
            return;    
        }  
        res.status(413).send({"Mensaje": error.message});
    }
});

app.get('/usuarios/:id',async (req,res)=>{
    try{
        let registros=await qy ('SELECT * FROM usuario WHERE id=?',req.params.id);
        if (registros.length==0){
            throw new Error ('No se han encontrado usuarios con ese id.');
            
        } 
        res.status(200).send(registros);
    }
    catch(error){
        if(error.message!= 'No se han encontrado usuarios con ese id.'){
            res.status(413).send({"Mensaje": "error inesperado"});
            return;    
        }
        res.status(413).send({"Mensaje": error.message});
    }
});

app.get('/usuarios/:id/mensajes',async (req,res)=>{
    try{
        let registros=await qy ('SELECT * FROM mensaje WHERE persona_id=?',req.params.id);
        if (registros.length==0) {
            
            throw new Error ('No se han encontrado mensajes de ese usuario.');
            
        }
        res.status(200).send(registros);
    }
    catch(error){
        if(error.message!= 'No se han encontrado mensajes de ese usuario.'){
            res.status(413).send({"Mensaje": "error inesperado"});
            return;    
        }        
        res.status(413).send({"Mensaje": error.message});
    }
});

app.get('/usuarios/:id/mensajes/:idm',async (req,res)=>{
    try{
        let registros=await qy ('SELECT * FROM mensaje WHERE persona_id=? and id=?',[req.params.id, req.params.idm]);
        if (registros.length==0){
            throw new Error('No se han encontrado mensajes con ese id de ese usuario.');
            
        } 
        res.status(200).send(registros);
    }
    catch(error){
        if(error.message!= 'No se han encontrado mensajes con ese id de ese usuario.'){
            res.status(413).send({"Mensaje": "error inesperado"});
            return;    
        }
        res.status(413).send({"Mensaje": error.message});
    }
});


/*********************************************************************/

app.post('/formContact',async (req,res)=>{

    //tomo los datos provenientes del formulario y reviso que no falte ninguno

    if(!req.body.nombre || !req.body.apellido || !req.body.mail || !req.body.celular ||!req.body.mensaje){
        
        res.status(413).send ('debe ingresar toda la informacion para poder enviar un mensaje');
        return;
    
    }
    
    //si no falto ninguno primero consulto si el mail no esta generado, si ya aparece en la base tiro error.
    try{
        let registros=await qy ('SELECT * FROM usuario WHERE mail=?',req.body.mail);
        
        if (registros.length!=0) {

            let regdos= await qy('insert into mensaje(mensaje,persona_id) values(?,?)',[req.body.mensaje,registros[0].id]);
            
        }else{
            let regtres=await qy('insert into usuario (nombre,apellido,mail,celular) values(?,?,?,?)',[req.body.nombre,req.body.apellido,req.body.mail,req.body.celular]);
            
            let regcuatro=await qy ('SELECT * FROM usuario WHERE mail=?',req.body.mail);
            
            let regcinco= await qy('insert into mensaje(mensaje,persona_id) values(?,?)',[req.body.mensaje,regcuatro[0].id]);
            
        }

        res.status(200).send({"mensaje":"registros ingresados"});
    }
    catch(error){
       
        res.status(413).send({"Mensaje": "error inesperado"});
    }
      
});

app.listen(process.env.PORT,()=>{
    console.log('puerto '+ process.env.PORT);
});