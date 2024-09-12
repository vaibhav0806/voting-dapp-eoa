import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { ELECTION_CONTRACT_ADDRESS, ELECTION_CONTRACT_ABI, NETWORK_CONFIG } from './contractConfig';

export function useElectionContract() {
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);

    useEffect(() => {
        async function initializeContract() {
            if (ready && authenticated && wallets.length > 0) {
                const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');

                if (embeddedWallet) {
                    const provider = await embeddedWallet.getEthersProvider();

                    // Check if the wallet is connected to Sepolia
                    const network = await provider.getNetwork();
                    if (network.chainId !== NETWORK_CONFIG.id) {
                        try {
                            // Request network switch
                            await embeddedWallet.switchChain(84532);
                        } catch (switchError: any) {
                            // This error code indicates that the chain has not been added to the wallet.
                            if (switchError.code === 4902) {
                                console.error("Failed to switch to Sepolia network:", switchError);
                                return;
                            }
                        }
                    }

                    const signer = provider.getSigner();
                    setSigner(signer);

                    const electionContract = new ethers.Contract(
                        ELECTION_CONTRACT_ADDRESS,
                        ELECTION_CONTRACT_ABI,
                        signer
                    );

                    setContract(electionContract);
                }
            }
        }

        initializeContract();
    }, [ready, authenticated, wallets]);

    // Contract interaction functions
    const addCandidate = async (candidateName: string) => {
        if (!contract) return;
        try {
            const tx = await contract.addCandidate(candidateName);
            await tx.wait();
        } catch (error) {
            console.error("Error adding candidate:", error);
        }
    };

    const authorizeVoter = async (voterAddress: string) => {
        if (!contract) return;
        try {
            const tx = await contract.authorizeVoter(voterAddress);
            await tx.wait();
        } catch (error) {
            console.error("Error authorizing voter:", error);
        }
    };

    const startElection = async () => {
        if (!contract) return;
        try {
            const tx = await contract.startElection();
            await tx.wait();
        } catch (error) {
            console.error("Error starting election:", error);
        }
    };

    const endElection = async () => {
        if (!contract) return;
        try {
            const tx = await contract.endElection();
            await tx.wait();
        } catch (error) {
            console.error("Error ending election:", error);
        }
    };

    const vote = async (candidateIndex: number) => {
        if (!contract) return;
        try {
            const tx = await contract.vote(candidateIndex);
            await tx.wait();
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    const getWinner = async () => {
        if (!contract) return;
        try {
            return await contract.getWinner();
        } catch (error) {
            console.error("Error getting winner:", error);
        }
    };

    const getAllCandidates = async () => {
        if (!contract) return;
        try {
            return await contract.getAllCandidates();
        } catch (error) {
            console.error("Error getting candidates:", error);
        }
    };

    return {
        contract,
        signer,
        addCandidate,
        authorizeVoter,
        startElection,
        endElection,
        vote,
        getWinner,
        getAllCandidates
    };
}