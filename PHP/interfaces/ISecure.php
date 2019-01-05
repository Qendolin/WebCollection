<?php
interface ISecure {
    public function Hash($unhashed);
    public function IsAllowed($neededrank);
    public function MakeCode();
    public function SetCookie($name, $value, $expire=-1, $path="/");
    public function Encrypt($string, $key);
    public function ReadCookie($name);
    public function Decrypt($string, $key);
    public function AddEmp($username, $rank, $school, $password, $uUsername, $uPassword);
    public function EditEmp($username, $rank, $school, $password, $uUsername, $uPassword);
    public function EmpLogin($username, $password);
    public function VerifyHash($hashed, $unhashed);
    public function IsEmp();
}
