import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { ELECTION_CONTRACT_ABI as CONTRACT_ABI } from "./contractConfig";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
} from "@/components/ui/navigation-menu";

// // ABI of your smart contract (replace with your actual ABI)
// const CONTRACT_ABI = [
//     "function vote(uint256 candidateIndex) public",
//     "function getWinner() public view returns (string memory)",
//     "function getAllCandidates() public view returns (string[] memory, uint256[] memory)"
// ];

// Address of your smart contract on Base Sepolia (replace with your actual address)
const CONTRACT_ADDRESS = "0x82232676E3555E86208Da95d4D49c5c81aAf91ba";

export default function Component() {
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [address, setAddress] = useState<string>("");
    const [candidateIndex, setCandidateIndex] = useState('');
    const [winner, setWinner] = useState('');
    const [candidates, setCandidates] = useState<string[]>([]);
    const [voteCounts, setVoteCounts] = useState<number[]>([]);

    console.log(provider, signer);

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
                await provider.send("wallet_switchEthereumChain", [{ chainId: "0x14a34" }]); // Base Sepolia chainId
                const signer = provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                const address = await signer.getAddress();

                setProvider(provider);
                setSigner(signer);
                setContract(contract);
                setAddress(address);
            } catch (error: any) {
                if (error.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x14a34',
                                chainName: 'Base Sepolia',
                                nativeCurrency: {
                                    name: 'Ether',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['https://sepolia.base.org'],
                                blockExplorerUrls: ['https://sepolia.basescan.org']
                            }],
                        });
                    } catch (addError) {
                        console.error('Failed to add the Base Sepolia network', addError);
                    }
                } else {
                    console.error('Failed to connect wallet', error);
                }
            }
        } else {
            console.log('Please install MetaMask!');
        }
    };

    useEffect(() => {
        if (contract) {
            fetchCandidates();
        }
    }, [contract]);

    const fetchCandidates = async () => {
        if (contract) {
            try {
                const data = await contract.getAllCandidates();
                if (data) {
                    const [names, votes] = data;
                    setCandidates(names);
                    setVoteCounts(votes.map((v: ethers.BigNumber) => v.toNumber()));
                }
            } catch (error) {
                console.error('Failed to fetch candidates', error);
            }
        }
    };

    const handleVote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (contract && candidateIndex) {
            try {
                const tx = await contract.vote(parseInt(candidateIndex));
                await tx.wait();
                setCandidateIndex('');
                fetchCandidates(); // Refresh the candidates list after voting
            } catch (error) {
                console.error('Failed to vote', error);
            }
        }
    };

    const handleGetWinner = async () => {
        if (contract) {
            try {
                const winnerName = await contract.getWinner();
                setWinner(winnerName);
            } catch (error) {
                console.error('Failed to get winner', error);
            }
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-gray-100 to-gray-200 p-4">
            <header className="mb-8">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <Button
                                className="flex items-center gap-2"
                                variant={address ? "outline" : "default"}
                                onClick={connectWallet}
                            >
                                <Wallet className="h-4 w-4" />
                                {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
                            </Button>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </header>

            <main className="flex flex-col items-center space-y-8">
                <Table>
                    <TableCaption>List of Candidates</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Id</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Votes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.map((candidate, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{index}</TableCell>
                                <TableCell>{candidate}</TableCell>
                                <TableCell>{voteCounts[index]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Decentralized Voting</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex space-x-2 mb-4">
                            <Input
                                type="text"
                                value={candidateIndex}
                                onChange={(e) => setCandidateIndex(e.target.value)}
                                placeholder="Candidate Index"
                                className="flex-grow"
                            />
                            <Button onClick={handleVote} disabled={!address || !candidateIndex}>
                                Vote
                            </Button>
                        </div>
                        <div className="flex justify-center">
                            <Button onClick={handleGetWinner} disabled={!address}>
                                Get Winner
                            </Button>
                        </div>
                        {winner && (
                            <p className="mt-4 text-center font-semibold">
                                Winner: {winner}
                            </p>
                        )}
                        {!address && (
                            <p className="mt-4 text-sm text-gray-500 text-center">
                                Please connect your wallet to vote or get the winner.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}