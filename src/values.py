import torch
import numpy as np
import os

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print("device = " + str(device))

def clamp(x, a, b):
	return max(a, min(x, b))

gridSize = 5
unitCount = 6
maxRound = 48
actionSpace = torch.tensor([0, 1, 2, 3], dtype=torch.int).to(device)
actionCount = 4
actionVecs = torch.tensor([[1,0],[0,1],[-1,0],[0,-1]], dtype=torch.int).to(device)
gridVecs = torch.tensor(
	[[x,y] for x in range(gridSize) for y in range(gridSize)],
	dtype=torch.int
).to(device)
gridCount = gridVecs.size()[0]
gridLocs = torch.tensor([loc for loc in range(gridCount)], dtype=torch.int).to(device)

vecToLoc = torch.zeros((gridSize, gridSize),dtype=torch.int).to(device)
for loc in gridLocs:
	vec = gridVecs[loc]
	vecToLoc[vec[0], vec[1]] = loc

shift = torch.zeros((gridCount,actionCount),dtype=torch.int).to(device)
for loc in gridLocs:
	for dir in actionSpace:
		gridVec = gridVecs[loc]
		actionVec = actionVecs[dir]
		x = clamp(gridVec[0] + actionVec[0], 0, gridSize-1)
		y = clamp(gridVec[1] + actionVec[1], 0, gridSize-1)
		shift[loc,dir] = vecToLoc[x, y]

def stateToLocs(state):
	options = gridLocs.clone()
	s = state
	locs = torch.tensor([], dtype=torch.int).to(device)
	for _ in range(unitCount):
		optionCount = options.size()[0]
		i = s % optionCount
		s = (s-i) // optionCount
		locs = torch.cat((locs, options[i]))
		options = torch.cat((options[:i],options[i+1:]))
	return locs

optionCounts = torch.tensor(
	[gridCount - r for r in range(unitCount)], 
	dtype=torch.int32
).to(device)
stateCount = torch.prod(optionCounts,dtype=torch.int32).to(device)
coefficients = torch.tensor(
	[torch.prod(optionCounts[0:i]) for i in range(unitCount)],
	dtype=torch.int32
).to(device)
def locsToState (locs):
	options = gridLocs.clone()
	total = 0
	for unitIndex in range(unitCount):
		loc = locs[unitIndex]
		optionIndex = torch.nonzero(torch.where(options == loc, 1, 0))[0]
		options = torch.cat((options[:optionIndex],options[optionIndex+1:]))
		coefficient = coefficients[unitIndex]
		total += optionIndex * coefficient
	return total.to(dtype=torch.int32)

def getOutcome (state, action):
	locs = stateToLocs(state)
	movers = torch.tensor([0], dtype=torch.int).to(device)
	oldLoc = locs[0]
	for _ in range(unitCount):
		nextLoc = shift[oldLoc,action]
		if nextLoc == oldLoc:
			movers = []
			break
		obstacles = torch.nonzero(torch.where(locs == nextLoc, 1, 0))
		if obstacles.size()[0] == 0:
			break
		movers = torch.cat((movers, obstacles[0]))
		oldLoc = nextLoc
	for mover in movers:
		loc = locs[mover]
		locs[mover] = shift[loc,action]
	actorLoc = locs[0]
	locs = locs[1:]
	locs = torch.cat((locs, actorLoc.unsqueeze(0)))
	return locsToState(locs)

# Work From Here

def getValue0 (goals, state):
	print('goals',goals)
	print('state',state)
	locs = stateToLocs(state)
	myLocs = locs[[0,2,4]]
	otherLocs = locs[[1,3,5]]
	myScore = torch.isin(goals,myLocs).sum()
	otherScore = torch.isin(goals,otherLocs).sum()
	if(myScore == 2): return 100
	if(otherScore == 2): return -100
	return 0


states = torch.tensor(range(stateCount),dtype=torch.int32).to(device)

state = torch.tensor([63032467],dtype=torch.int32).to(device)
locs = stateToLocs(state).to(device)
outcome = getOutcome(state, 1).to(device)

goals = torch.tensor([12, 13],dtype=torch.int).to(device)
values = torch.zeros(stateCount, dtype=torch.int8).to(device)
values[outcome] = 100

os.system('clear')

# Still trying to figure out how to make this compatible with vmap
def testStateToLocs(state):
	s = state.clone()
	mask = torch.ones_like(gridLocs, dtype=torch.bool)
	locs = torch.tensor([], dtype=torch.int).to(device)
	for unitIndex in range(unitCount):
		optionCount = gridCount - unitIndex
		i = s % optionCount
		s = (s-i) // optionCount
		loc = gridLocs[mask][i.view(1)]
		locs = torch.cat((locs, loc))
		mask = mask.index_put((loc.view(1),), torch.tensor(False))
	return locs

testStateToLocs(state)
stateToLocs(state)

testStates = states[10000:10005]
x = torch.vmap(testStateToLocs,in_dims=0)(testStates)

# Update all function to be compatible with vmap
# Construct the initial value tensor using torch.vmap
# Perform value interation using torch.vmap
