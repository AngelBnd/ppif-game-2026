import Button from "@/Components/global/Button"
import StartButtonSVG from "../../assets/icons/StartButtonSVG.svg?react";
import { useNavigate } from "react-router-dom"

export default function JoiningPage(){
    const navigate = useNavigate();
    return (
        <div className="w-screen h-screen flex justify-center align-center overflow-hidden">
   
            <Button
                    className=""
                    Icon={StartButtonSVG}
                    iconClassName="w-30"
                    onClick={()=>{navigate("/game")}}
                />         
         
        </div>
    )
}