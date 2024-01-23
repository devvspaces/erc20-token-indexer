import { AttachmentIcon, CheckIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Text,
  useColorMode,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { useState } from 'react';

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const toast = useToast();

  const { colorMode, toggleColorMode } = useColorMode();

  const [defaultAccount, setDefaultAccount] = useState(null);
  const [userBalance, setUserBalance] = useState(null);

  const connectWalletHandler = () => {
    if (window.ethereum) {
      setIsLoadingWallet(true);
      provider.send("eth_requestAccounts", []).then(async () => {
        await accountChangedHandler(provider.getSigner());
      })
    } else {
      toast({
        title: 'Error',
        description: 'Please Install Metamask!!!',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }

  const accountChangedHandler = async (newAccount) => {
    const address = await newAccount.getAddress();
    setDefaultAccount(address);
    const balance = await newAccount.getBalance()
    setUserBalance(ethers.utils.formatEther(balance));
    await getUserBalance(address)
    setIsLoadingWallet(false);
  }
  const getUserBalance = async (address) => {
    const balance = await provider.getBalance(address, "latest")
  }

  async function loadTokens(address) {
    setIsLoading(true);

    const config = {
      apiKey: 'k-9KRx_ZzihIitkSZ6IMS0DJu14lS3NU',
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(address);

    if (!data.tokenBalances) {
      toast({
        title: 'Error',
        description: 'Address is not valid',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setIsLoading(false);
      return;
    }

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setIsLoading(false);
  }

  async function getTokenBalance() {

    // Validations
    if (!userAddress) {
      toast({
        title: 'Error',
        description: 'Please enter an address!',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    await loadTokens(userAddress)
  }

  function limitText(str, len = 15) {
    if (str.length > 10) {
      return str.substring(0, len) + "...";
    }
    return str;
  }

  return (
    <Box pb={12} px={5}>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connect Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {
              defaultAccount ? (<Box textAlign={'center'} py={5}>
                <Stack gap={'1rem'}>
                  <Text><strong>Wallet Address:</strong> {defaultAccount}</Text>
                  <Text><strong>Wallet Balance:</strong> {userBalance}</Text>
                </Stack>
                <Button colorScheme='blue' mt={8} onClick={async () => {
                  await loadTokens(defaultAccount)
                  setUserAddress(defaultAccount);
                  onClose()
                }} variant='solid'>Get ERC-20 Tokens</Button>
              </Box>) : (<Text>You have not connected your wallet yet!!</Text>)
            }
          </ModalBody>

          <ModalFooter justifyContent={'space-between'}>
            <Button isDisabled={defaultAccount} colorScheme='blue' isLoading={isLoadingWallet} onClick={connectWalletHandler} variant={'outline'}>Connect Wallet</Button>
            <Button colorScheme='red' mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Center my={12}>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <HStack>
            <IconButton
              variant='outline'
              colorScheme='blue'
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              mb={5}
            />
            <IconButton
              variant='outline'
              colorScheme='blue'
              icon={!defaultAccount ? <AttachmentIcon /> : <CheckIcon />}
              onClick={onOpen}
              mb={5}
            />
          </HStack>
          <Heading mb={1} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
        gap={'2rem'}
        bg={colorMode === 'light' ? 'gray.100' : 'gray.700'}
        maxW={'1200px'}
        mx={'auto'}
        py={'3rem'}
        rounded={'lg'}
      >
        <Heading>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          color={'black'}
        />
        <Button size={'lg'} isLoading={isLoading} fontSize={20} onClick={getTokenBalance} colorScheme='blue'>
          Check ERC-20 Token Balances
        </Button>
      </Flex>

      <Box>
        <Heading my={12} textAlign={'center'}>ERC-20 token balances</Heading>

        {hasQueried ? (
          <Flex wrap={'wrap'} gap={4} justify={'center'} align={'flex-start'}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Popover key={i}>
                  <PopoverTrigger>
                    <Flex
                      cursor={'pointer'}
                      color="white"
                      bg="blue.600"
                      w={'300px'}
                      p={5}
                      rounded={'md'}
                      gap={3}
                      alignItems={'center'}
                    >
                      <Box>
                        <Image src={tokenDataObjects[i].logo || 'eth.svg'} minW={'20px'} maxW={'20px'} />
                      </Box>
                      <Box>
                        <Box>
                          <b>Symbol:</b> ${limitText(tokenDataObjects[i].symbol, 10)}&nbsp;
                        </Box>
                        <Box>
                          <b>Balance:</b>&nbsp;
                          {limitText(Utils.formatUnits(
                            e.tokenBalance,
                            tokenDataObjects[i].decimals
                          ))}
                        </Box>
                      </Box>
                    </Flex>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>Details</PopoverHeader>
                    <PopoverBody>
                      <Text>{tokenDataObjects[i].symbol}</Text>
                      <Text>{Utils.formatUnits(
                        e.tokenBalance,
                        tokenDataObjects[i].decimals
                      )}</Text>
                      <Text fontWeight={500}>{e.contractAddress}</Text>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>

              );
            })}
          </Flex>
        ) : (
          'Please make a query! This may take a few seconds...'
        )}
      </Box>
    </Box>
  );
}

export default App;
