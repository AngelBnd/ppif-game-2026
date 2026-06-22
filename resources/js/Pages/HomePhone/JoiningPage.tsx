import Button from "@/Components/global/Button"
import StartButtonSVG from "../../assets/icons/StartButtonSVG.svg?react";
import { useNavigate } from "react-router-dom"

export default function JoiningPage(){
    const navigate = useNavigate();
    return (
        <div>
            <div>
                <Button
                    className=""
                    Icon={StartButtonSVG}
                    iconClassName="w-30"
                    onClick={()=>{navigate("/games")}}
                />
                <StartButtonSVG/>
            </div>
        </div>
    )
}