import Button from '@/Components/global/Button';
import NextButton from '@/assets/icons/NextButtonSVG.svg?react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminGameFlow } from '../../data/adminGameFlow';
import ActivityPage from './ActivityPage';
import AnswerTheQuestionPage from './AnswerTheQuestionPage';
import BossFightPage from './BossFightPage';
import StorylinePage from './StorylinePage';
import WaitingRoomPage from './WaitingRoompage';

export default function AdminFlowPage() {
    const { stepId } = useParams();
    const navigate = useNavigate();

    const step = adminGameFlow.find((item) => item.slug === stepId);

    if (!step) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Page Not Found</h1>
                    <button
                        onClick={() => navigate('/admin/prologue')}
                        className="mt-6 rounded-xl bg-white px-6 py-3 text-black"
                    >
                        Back to Start
                    </button>
                </div>
            </main>
        );
    }

    const goNext = () => {
        if (step.next) {
            navigate(`/admin/${step.next}`);
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden">
            {step.type !== 'waiting' && (
                <Button
                    Icon={NextButton}
                    className="absolute right-8 top-8 z-50"
                    iconClassName="w-48"
                    onClick={goNext}
                />
            )}

            {step.type === 'waiting' && (
                <WaitingRoomPage step={step} goNext={goNext} />
            )}

            {step.type === 'story' && <StorylinePage step={step} />}

            {step.type === 'answer' && <AnswerTheQuestionPage step={step} />}

            {step.type === 'activity' && <ActivityPage step={step} />}

            {step.type === 'boss' && <BossFightPage step={step} />}
        </div>
    );
}
