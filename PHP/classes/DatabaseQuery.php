<?php
class DatabaseQuery implements DatabaseQueryBase {

  private  $conns=array();

public function AddConn($dbName,$username,$password,$host="localhost"){
$conns[]=array($host,$dbName,$username,$password);

}


    protected  function OpenConn($db=0){
if(!BasicTools::IsSenseful($conns[$db]))trigger_error("#",E_USER_ERROR);

$conn = new PDO('mysql:host='.$conns[$db][0].';dbname='.$conns[$db][1], $conns[$db][2], $conns[$db][3]);
        if (!$conn) {
            trigger_error("#error005", E_USER_ERROR);
        }
        return $conn;
    }
}